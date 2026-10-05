import { htmlToPlainText } from '../../server/utils/html';
import type { LegacyPage } from './pageTree';
import { legacyPlainText } from './text';

export const FAQ_PAGE_PATH = 'faq';

const FAQ_PAGE_TITLE_PATTERN = /^MENU - FAQ$/i;
const FALLBACK_CATEGORY_NAME = 'FAQ';

const BLANK = String.raw`(?:\s|&nbsp;|<br\s*/?>)`;
const BOLD_LINE = String.raw`<p>${BLANK}*<strong>((?:(?!</?strong>)[\s\S])+)</strong>${BLANK}*`;

const BLOCK_START_PATTERN = /(?=<(?:p|h[2-6])\b)/i;
const BLANK_BLOCK_PATTERN = new RegExp(String.raw`^(?:<p\b[^>]*>${BLANK}*</p>)?\s*$`, 'i');
const QUESTION_PATTERN = new RegExp(String.raw`^${BOLD_LINE}</p>\s*$`, 'i');
const QUESTION_WITH_ANSWER_PATTERN = new RegExp(String.raw`^${BOLD_LINE}<br\s*/?>${BLANK}*([\s\S]+?)</p>\s*$`, 'i');
const HEADING_PATTERN = /^<h[2-6]\b|^<p\b[^>]*text-align:\s*center[^>]*>[\s\S]*<strong>/i;
const QUESTION_NUMBER_PATTERN = /^\d+\.\s*/;

export interface LegacyFaqItem {
  title: string;
  descriptionHtml: string;
}

export interface LegacyFaqCategory {
  name: string;
  items: LegacyFaqItem[];
}

export const isFaqPage = (page: LegacyPage): boolean => FAQ_PAGE_TITLE_PATTERN.test(legacyPlainText(page.title));

const titleOf = (html: string): string => htmlToPlainText(html).replace(QUESTION_NUMBER_PATTERN, '');

const startItem = (
  categories: LegacyFaqCategory[],
  title: string,
  descriptionHtml: string,
  categoryHeading: string | null,
): LegacyFaqItem => {
  if (categoryHeading !== null || !categories.length) {
    categories.push({ name: categoryHeading === null ? FALLBACK_CATEGORY_NAME : titleOf(categoryHeading), items: [] });
  }
  const item = { title: titleOf(title), descriptionHtml };
  categories.at(-1)!.items.push(item);
  return item;
};

// A heading names a category when questions follow it; when plain content follows, it is a question itself.
export const splitFaqPage = (html: string): LegacyFaqCategory[] => {
  const categories: LegacyFaqCategory[] = [];
  let pendingHeading: string | null = null;
  let openItem: LegacyFaqItem | null = null;

  for (const block of html.split(BLOCK_START_PATTERN)) {
    if (BLANK_BLOCK_PATTERN.test(block)) {
      continue;
    }
    const question = QUESTION_PATTERN.exec(block)?.[1];
    const questionWithAnswer = QUESTION_WITH_ANSWER_PATTERN.exec(block);
    const isBoldAnswer = Boolean(question) && openItem?.descriptionHtml === '';

    if (question && !isBoldAnswer) {
      openItem = startItem(categories, question, '', pendingHeading);
      pendingHeading = null;
    } else if (questionWithAnswer && !isBoldAnswer) {
      openItem = startItem(categories, questionWithAnswer[1]!, `<p>${questionWithAnswer[2]}</p>`, pendingHeading);
      pendingHeading = null;
    } else if (HEADING_PATTERN.test(block)) {
      pendingHeading = block;
      openItem = null;
    } else if (openItem) {
      openItem.descriptionHtml += block;
    } else if (pendingHeading) {
      openItem = startItem(categories, pendingHeading, block, null);
      pendingHeading = null;
    }
  }

  return categories
    .map((category) => ({
      name: category.name,
      items: category.items
        .map((item) => ({ ...item, descriptionHtml: item.descriptionHtml.trim() }))
        .filter((item) => item.descriptionHtml),
    }))
    .filter((category) => category.items.length > 0);
};
