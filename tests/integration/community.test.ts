import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { listComments } from '../../server/utils/comments';
import { castPollVote, createComment, createShout } from '../../server/utils/communityWrites';
import { schema, useDb } from '../../server/utils/db';
import { listPolls } from '../../server/utils/polls';
import { createAccount, createNews, createPoll, resetDatabase } from './fixtures';

describe('comments', () => {
  beforeEach(resetDatabase);

  it('adds a comment to published content and lists only visible ones', () => {
    const author = createAccount();
    const news = createNews(author.id);
    const visible = createComment('news', news.id, author, '<p>Widoczny</p>');
    const hidden = createComment('news', news.id, author, '<p>Ukryty</p>');
    useDb().update(schema.comments).set({ isHidden: true }).where(eq(schema.comments.id, hidden.id)).run();

    const listed = listComments('news', news.id, 1);

    expect(listed.total).toBe(1);
    expect(listed.items[0]).toMatchObject({ id: visible.id, author: { name: author.name, isGhost: false } });
  });

  it('refuses comments on drafts, on content with comments switched off and on missing content', () => {
    const author = createAccount();
    const draft = createNews(author.id, { status: 'draft' });
    const closed = createNews(author.id, { commentsEnabled: false });

    expect(() => createComment('news', draft.id, author, '<p>A</p>')).toThrowError(/nie można komentować/);
    expect(() => createComment('news', closed.id, author, '<p>A</p>')).toThrowError(/nie można komentować/);
    expect(() => createComment('photo', 12_345, author, '<p>A</p>')).toThrowError(/nie można komentować/);
  });
});

describe('polls', () => {
  beforeEach(resetDatabase);

  it('counts archived and new votes together and remembers the voter choice', () => {
    const voter = createAccount();
    const { poll, options } = createPoll();

    castPollVote(poll.id, options[0]!.id, voter);

    const [listed] = listPolls(1, voter.id).items;
    expect(listed).toMatchObject({ isOpen: true, votedOptionId: options[0]!.id });
    expect(listed!.options.map((option) => option.voteCount)).toEqual([6, 0]);
    expect(listPolls(1, null).items[0]!.votedOptionId).toBeNull();
  });

  it('accepts one vote per account', () => {
    const voter = createAccount();
    const { poll, options } = createPoll();
    castPollVote(poll.id, options[0]!.id, voter);

    expect(() => castPollVote(poll.id, options[1]!.id, voter)).toThrowError(/już oddany/);
  });

  it('refuses votes in a closed poll and for an option of another poll', () => {
    const voter = createAccount();
    const closed = createPoll({ isClosed: true });
    const open = createPoll();

    expect(() => castPollVote(closed.poll.id, closed.options[0]!.id, voter)).toThrowError(/zakończona/);
    expect(() => castPollVote(open.poll.id, closed.options[0]!.id, voter)).toThrowError(/zakończona/);
  });
});

describe('shoutbox', () => {
  beforeEach(resetDatabase);

  it('stores a message as escaped text with line breaks', () => {
    const shout = createShout(createAccount(), 'Cześć <b>rycerze</b>\nco słychać?');

    expect(shout.bodyHtml).toBe('Cześć &lt;b&gt;rycerze&lt;/b&gt;<br />co słychać?');
  });
});
