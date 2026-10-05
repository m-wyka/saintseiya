import { asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';
import { qualified } from './sqlHelpers';

const POLLS_PAGE_SIZE = 10;

const liveVoteCount = sql<number>`(
  SELECT COUNT(*) FROM ${schema.pollVotes}
  WHERE ${qualified(schema.pollVotes.optionId)} = ${qualified(schema.pollOptions.id)}
)`;

const optionsOfPolls = (pollIds: number[]) => {
  if (!pollIds.length) {
    return new Map<number, { id: number; label: string; voteCount: number }[]>();
  }
  const options = useDb()
    .select({
      id: schema.pollOptions.id,
      pollId: schema.pollOptions.pollId,
      label: schema.pollOptions.label,
      voteCount: sql<number>`${schema.pollOptions.archivedVoteCount} + ${liveVoteCount}`,
    })
    .from(schema.pollOptions)
    .where(inArray(schema.pollOptions.pollId, pollIds))
    .orderBy(asc(schema.pollOptions.sortOrder), asc(schema.pollOptions.id))
    .all();
  const grouped = Map.groupBy(options, (option) => option.pollId);
  return new Map(
    [...grouped].map(([pollId, group]) => [pollId, group.map(({ pollId: _pollId, ...option }) => option)]),
  );
};

const votedOptionsOf = (userId: number | null, pollIds: number[]) => {
  if (userId === null || !pollIds.length) {
    return new Map<number, number>();
  }
  const votes = useDb()
    .select({ pollId: schema.pollVotes.pollId, optionId: schema.pollVotes.optionId })
    .from(schema.pollVotes)
    .where(sql`${schema.pollVotes.userId} = ${userId} AND ${inArray(schema.pollVotes.pollId, pollIds)}`)
    .all();
  return new Map(votes.map((vote) => [vote.pollId, vote.optionId]));
};

export const listPolls = (page: number, viewerId: number | null) => {
  const db = useDb();
  const polls = db
    .select()
    .from(schema.polls)
    .orderBy(desc(schema.polls.startedAt), desc(schema.polls.id))
    .limit(POLLS_PAGE_SIZE)
    .offset(pageOffset(page, POLLS_PAGE_SIZE))
    .all();
  const pollIds = polls.map((poll) => poll.id);
  const options = optionsOfPolls(pollIds);
  const votedOptions = votedOptionsOf(viewerId, pollIds);
  const total = db.select({ total: count() }).from(schema.polls).get()?.total ?? 0;
  const items = polls.map((poll) => ({
    id: poll.id,
    question: poll.question,
    startedAt: poll.startedAt,
    endedAt: poll.endedAt,
    isOpen: poll.endedAt === null,
    options: options.get(poll.id) ?? [],
    votedOptionId: votedOptions.get(poll.id) ?? null,
  }));
  return paginated(items, total, page, POLLS_PAGE_SIZE);
};

export const findOpenPollOption = (pollId: number, optionId: number) =>
  useDb()
    .select({ id: schema.pollOptions.id })
    .from(schema.pollOptions)
    .innerJoin(schema.polls, eq(schema.polls.id, schema.pollOptions.pollId))
    .where(
      sql`${schema.pollOptions.id} = ${optionId} AND ${schema.polls.id} = ${pollId} AND ${schema.polls.endedAt} IS NULL`,
    )
    .get();
