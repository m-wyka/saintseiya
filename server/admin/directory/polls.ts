import { and, asc, count, desc, eq, inArray, isNotNull, isNull, like, sql } from 'drizzle-orm';
import { z } from 'zod';
import { messageKey } from '#shared/utils/messages';
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from '#shared/utils/pollLimits';
import type { Tx } from '../../db';

const POLLS_PAGE_SIZE = 20;

const optionSchema = z.object({
  id: z.number().int().positive().nullable().default(null),
  label: z.string().trim().min(1, 'VALIDATION.POLL_OPTION_EMPTY').max(200, 'VALIDATION.POLL_OPTION_TOO_LONG'),
});

type PollOptionInput = z.infer<typeof optionSchema>;

const storedIdsOf = (options: PollOptionInput[]): number[] => options.flatMap((option) => option.id ?? []);

const hasEachStoredOptionOnce = (options: PollOptionInput[]): boolean => {
  const ids = storedIdsOf(options);
  return new Set(ids).size === ids.length;
};

const hasDistinctLabels = (options: PollOptionInput[]): boolean =>
  new Set(options.map((option) => option.label.toLocaleLowerCase('pl'))).size === options.length;

const inputSchema = z.object({
  question: z
    .string()
    .trim()
    .min(5, 'VALIDATION.POLL_QUESTION_TOO_SHORT')
    .max(300, 'VALIDATION.POLL_QUESTION_TOO_LONG'),
  options: z
    .array(optionSchema)
    .min(MIN_POLL_OPTIONS, messageKey('VALIDATION.POLL_TOO_FEW_OPTIONS', { min: MIN_POLL_OPTIONS }))
    .max(MAX_POLL_OPTIONS, messageKey('VALIDATION.POLL_TOO_MANY_OPTIONS', { max: MAX_POLL_OPTIONS }))
    .refine(hasEachStoredOptionOnce, 'VALIDATION.POLL_OPTION_LISTED_TWICE')
    .refine(hasDistinctLabels, 'VALIDATION.POLL_OPTIONS_NOT_DISTINCT'),
  isClosed: z.boolean().default(false),
});

const liveVoteCount = sql<number>`(
  SELECT COUNT(*) FROM ${schema.pollVotes}
  WHERE ${qualified(schema.pollVotes.optionId)} = ${qualified(schema.pollOptions.id)}
)`;

const totalVoteCount = sql<number>`(
  (SELECT COALESCE(SUM(${qualified(schema.pollOptions.archivedVoteCount)}), 0) FROM ${schema.pollOptions}
    WHERE ${qualified(schema.pollOptions.pollId)} = ${qualified(schema.polls.id)}) +
  (SELECT COUNT(*) FROM ${schema.pollVotes}
    WHERE ${qualified(schema.pollVotes.pollId)} = ${qualified(schema.polls.id)})
)`;

const optionsOf = (pollId: number) =>
  useDb()
    .select({
      id: schema.pollOptions.id,
      label: schema.pollOptions.label,
      voteCount: sql<number>`${schema.pollOptions.archivedVoteCount} + ${liveVoteCount}`,
    })
    .from(schema.pollOptions)
    .where(eq(schema.pollOptions.pollId, pollId))
    .orderBy(asc(schema.pollOptions.sortOrder), asc(schema.pollOptions.id))
    .all();

const storedOptionIdsOf = (tx: Tx, pollId: number): number[] =>
  tx
    .select({ id: schema.pollOptions.id })
    .from(schema.pollOptions)
    .where(eq(schema.pollOptions.pollId, pollId))
    .all()
    .map((option) => option.id);

const removeDroppedOptions = (tx: Tx, storedIds: number[], keptIds: number[]) => {
  const droppedIds = storedIds.filter((id) => !keptIds.includes(id));
  if (droppedIds.length) {
    tx.delete(schema.pollOptions).where(inArray(schema.pollOptions.id, droppedIds)).run();
  }
};

const storeOption = (tx: Tx, pollId: number, option: PollOptionInput, sortOrder: number) => {
  if (option.id === null) {
    tx.insert(schema.pollOptions).values({ pollId, label: option.label, sortOrder }).run();
    return;
  }
  tx.update(schema.pollOptions)
    .set({ label: option.label, sortOrder })
    .where(eq(schema.pollOptions.id, option.id))
    .run();
};

const replaceOptions = (tx: Tx, pollId: number, options: PollOptionInput[]) => {
  const storedIds = storedOptionIdsOf(tx, pollId);
  const keptIds = storedIdsOf(options);
  if (keptIds.some((id) => !storedIds.includes(id))) {
    throw conflict('ERRORS.POLL_CHANGED');
  }
  removeDroppedOptions(tx, storedIds, keptIds);
  options.forEach((option, sortOrder) => storeOption(tx, pollId, option, sortOrder));
};

const endedAtAfterUpdate = (tx: Tx, pollId: number, isClosed: boolean): Date | null => {
  if (!isClosed) {
    return null;
  }
  const poll = tx.select({ endedAt: schema.polls.endedAt }).from(schema.polls).where(eq(schema.polls.id, pollId)).get();
  return poll?.endedAt ?? new Date();
};

export const pollsResource = defineAdminResource({
  access: 'polls',
  inputSchema,
  list: ({ page, search, filter }) => {
    const db = useDb();
    const where = and(
      search ? like(schema.polls.question, `%${search}%`) : undefined,
      filter === 'open' ? isNull(schema.polls.endedAt) : undefined,
      filter === 'closed' ? isNotNull(schema.polls.endedAt) : undefined,
    );
    const items = db
      .select({
        id: schema.polls.id,
        question: schema.polls.question,
        startedAt: schema.polls.startedAt,
        endedAt: schema.polls.endedAt,
        totalVotes: totalVoteCount,
      })
      .from(schema.polls)
      .where(where)
      .orderBy(desc(schema.polls.startedAt), desc(schema.polls.id))
      .limit(POLLS_PAGE_SIZE)
      .offset(pageOffset(page, POLLS_PAGE_SIZE))
      .all();
    const total = db.select({ total: count() }).from(schema.polls).where(where).get()?.total ?? 0;
    return paginated(items, total, page, POLLS_PAGE_SIZE);
  },
  find: (id) => {
    const poll = useDb().select().from(schema.polls).where(eq(schema.polls.id, id)).get();
    if (!poll) {
      return undefined;
    }
    return {
      id: poll.id,
      question: poll.question,
      startedAt: poll.startedAt,
      endedAt: poll.endedAt,
      isClosed: poll.endedAt !== null,
      options: optionsOf(id),
    };
  },
  create: (input) =>
    useDb().transaction((tx) => {
      const now = new Date();
      const poll = tx
        .insert(schema.polls)
        .values({ question: input.question, startedAt: now, endedAt: input.isClosed ? now : null })
        .returning({ id: schema.polls.id })
        .get();
      replaceOptions(tx, poll.id, input.options);
      return poll;
    }),
  update: (id, input) => {
    useDb().transaction((tx) => {
      tx.update(schema.polls)
        .set({ question: input.question, endedAt: endedAtAfterUpdate(tx, id, input.isClosed) })
        .where(eq(schema.polls.id, id))
        .run();
      replaceOptions(tx, id, input.options);
    });
  },
  remove: (id) => {
    useDb().delete(schema.polls).where(eq(schema.polls.id, id)).run();
  },
});
