import type { CommentTarget } from '#shared/utils/content';
import type { Account } from './accounts';
import { schema, useDb } from './db';

const CONFLICT = 409;

export const createComment = (targetKind: CommentTarget, targetId: number, author: Account, bodyHtml: string) => {
  if (!acceptsComments(targetKind, targetId)) {
    throw createError({ statusCode: 404, statusMessage: 'ERRORS.COMMENTS_UNAVAILABLE' });
  }
  return useDb()
    .insert(schema.comments)
    .values({ targetKind, targetId, authorId: author.id, bodyHtml })
    .returning()
    .get();
};

export const createShout = (author: Account, message: string) =>
  useDb()
    .insert(schema.shouts)
    .values({ authorId: author.id, bodyHtml: shoutToHtml(message) })
    .returning()
    .get();

export const castPollVote = (pollId: number, optionId: number, voter: Account) => {
  if (!findOpenPollOption(pollId, optionId)) {
    throw createError({ statusCode: 404, statusMessage: 'ERRORS.POLL_UNAVAILABLE' });
  }
  const inserted = useDb()
    .insert(schema.pollVotes)
    .values({ pollId, optionId, userId: voter.id })
    .onConflictDoNothing()
    .run();
  if (!inserted.changes) {
    throw createError({ statusCode: CONFLICT, statusMessage: 'ERRORS.POLL_ALREADY_VOTED' });
  }
};
