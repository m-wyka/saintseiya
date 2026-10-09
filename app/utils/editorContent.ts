const TEXT_BLOCK_SELECTOR = 'p, h2, h3, h4, h5, h6';
const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'TABLE',
  'UL',
  'OL',
  'BLOCKQUOTE',
  'PRE',
  'HR',
  'IFRAME',
  'DETAILS',
]);
const NEEDS_REWRITE_PATTERN = /<div\b[^>]*\bstyle=|<[ou]l>\s*<\/[ou]l>/i;

const isBlock = (node: Node): boolean => node instanceof Element && BLOCK_TAGS.has(node.tagName);

const isBlank = (nodes: Node[]): boolean =>
  nodes.every((node) => node.nodeType === Node.TEXT_NODE && !node.textContent?.trim());

const isLineBreak = (node: Node): boolean => node instanceof Element && node.tagName === 'BR';

const holdsNothing = (list: Element): boolean => isBlank([...list.childNodes].filter((node) => !isLineBreak(node)));

const closestStyled = (node: Node, property: 'color' | 'textAlign'): HTMLElement | null => {
  for (let element = node.parentElement; element; element = element.parentElement) {
    if (element.style[property]) {
      return element;
    }
  }
  return null;
};

const wrapInlineRuns = (container: HTMLElement, alignment: string) => {
  const wrap = (run: Node[]) => {
    if (isBlank(run)) {
      return;
    }
    const paragraph = container.ownerDocument.createElement('p');
    paragraph.style.textAlign = alignment;
    container.insertBefore(paragraph, run[0]!);
    paragraph.append(...run);
  };
  let run: Node[] = [];
  for (const child of [...container.childNodes]) {
    if (isBlock(child)) {
      wrap(run);
      run = [];
    } else {
      run.push(child);
    }
  }
  wrap(run);
};

const moveAlignmentToTextBlocks = (container: HTMLElement) => {
  const alignment = container.style.textAlign;
  for (const block of container.querySelectorAll<HTMLElement>(TEXT_BLOCK_SELECTOR)) {
    if (closestStyled(block, 'textAlign') === container && !block.style.textAlign) {
      block.style.textAlign = alignment;
    }
  }
  wrapInlineRuns(container, alignment);
  container.style.textAlign = '';
};

const moveColorToText = (container: HTMLElement) => {
  const color = container.style.color;
  const walker = container.ownerDocument.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const ownTexts: Text[] = [];
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    if (text.data.trim() && closestStyled(text, 'color') === container) {
      ownTexts.push(text);
    }
  }
  for (const text of ownTexts) {
    const span = container.ownerDocument.createElement('span');
    span.style.color = color;
    text.replaceWith(span);
    span.append(text);
  }
  container.style.color = '';
};

// The editor has no node for a <div> and would drop it together with its centring and colour: both move to the
// paragraphs and text inside before the editor sees them. An empty list would come back with one empty item.
export const editableHtml = (html: string): string => {
  if (!NEEDS_REWRITE_PATTERN.test(html)) {
    return html;
  }
  const { body } = new DOMParser().parseFromString(html, 'text/html');
  for (const container of body.querySelectorAll<HTMLElement>('div[style]')) {
    if (container.style.color) {
      moveColorToText(container);
    }
    if (container.style.textAlign) {
      moveAlignmentToTextBlocks(container);
    }
  }
  for (const list of body.querySelectorAll('ul, ol')) {
    if (holdsNothing(list)) {
      list.remove();
    }
  }
  return body.innerHTML;
};
