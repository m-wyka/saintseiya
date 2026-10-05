import { RESERVED_ROOT_SEGMENTS } from '../../shared/utils/routes';
import { slugify, uniqueSlug } from '../../shared/utils/slug';
import type { ContentStatus, PageKind } from '../../shared/utils/content';
import { calmTitle, legacyPlainText } from './text';

const MINIMUM_CONTENT_LENGTH = 50;
const PLACEHOLDER_TITLE_PATTERN = /^00 pust/i;
const PAGE_LINK_PATTERN = /viewpage\.php\?page_id=(\d+)/g;
const TITLE_SEPARATOR_PATTERN = /\s+-\s+/;
const TITLE_NAMESPACE_FIXES: [RegExp, string][] = [
  [/^mitologia\s+(grecka|rzymska|skandynawska)\b/i, 'MITOLOGIA - $1'],
  [/^fan\s+-\s+arty\b/i, 'Fan Arty'],
];
const NAMESPACES_HIDDEN_IN_TITLES = new Set(['menu', 'inne', 'informacje', 'astronomia']);
const PUBLIC_ACCESS_LEVELS = new Set([0, 101]);

export interface LegacyPage {
  id: number;
  title: string;
  content: string;
  access: number;
  allowsComments: boolean;
}

export interface PlannedPage {
  key: string;
  parentKey: string | null;
  legacyId: number | null;
  legacyTitle: string | null;
  title: string;
  slug: string;
  path: string;
  kind: PageKind;
  status: ContentStatus;
  commentsEnabled: boolean;
  sortOrder: number;
}

interface TreeNode {
  key: string;
  page: LegacyPage | null;
  parent: TreeNode | null;
  title: string;
  children: TreeNode[];
}

const pageKey = (legacyId: number) => `page:${legacyId}`;

const withConsistentNamespace = (title: string): string =>
  TITLE_NAMESPACE_FIXES.reduce((fixed, [pattern, replacement]) => fixed.replace(pattern, replacement), title);

const titleSegments = (title: string): string[] =>
  withConsistentNamespace(legacyPlainText(title)).split(TITLE_SEPARATOR_PATTERN).map(calmTitle).filter(Boolean);

const segmentsKey = (segments: string[]): string => slugify(segments.join(' '));

export const isMigratablePage = (page: LegacyPage): boolean =>
  !PLACEHOLDER_TITLE_PATTERN.test(page.title.trim()) && page.content.trim().length >= MINIMUM_CONTENT_LENGTH;

export const isPublicPage = (page: LegacyPage): boolean => PUBLIC_ACCESS_LEVELS.has(page.access);

const linkedPageIds = (page: LegacyPage, knownIds: Set<number>): number[] => {
  const ids = [...page.content.matchAll(PAGE_LINK_PATTERN)].map((match) => Number(match[1]));
  return [...new Set(ids)].filter((id) => id !== page.id && knownIds.has(id));
};

const rootSegments = (segments: string[]): string[] =>
  segments.length > 1 && NAMESPACES_HIDDEN_IN_TITLES.has(slugify(segments[0]!)) ? segments.slice(1) : segments;

const segmentsBelowParent = (child: string[], parent: string[]): string[] => {
  const parentKey = segmentsKey(parent);
  for (let length = child.length - 1; length >= 1; length -= 1) {
    if (segmentsKey(child.slice(0, length)) === parentKey) {
      return child.slice(length);
    }
  }
  let shared = 0;
  while (shared < child.length - 1 && shared < parent.length && slugify(child[shared]!) === slugify(parent[shared]!)) {
    shared += 1;
  }
  if (shared > 0) {
    return child.slice(shared);
  }
  return child.length > 1 ? child.slice(1) : child;
};

const discoverParents = (pages: Map<number, LegacyPage>, navigationRootIds: number[]): Map<number, number | null> => {
  const knownIds = new Set(pages.keys());
  const parentOf = new Map<number, number | null>();
  const queue: number[] = [];
  for (const rootId of navigationRootIds) {
    if (knownIds.has(rootId) && !parentOf.has(rootId)) {
      parentOf.set(rootId, null);
      queue.push(rootId);
    }
  }
  for (let index = 0; index < queue.length; index += 1) {
    const currentId = queue[index]!;
    for (const linkedId of linkedPageIds(pages.get(currentId)!, knownIds)) {
      if (!parentOf.has(linkedId)) {
        parentOf.set(linkedId, currentId);
        queue.push(linkedId);
      }
    }
  }
  return parentOf;
};

const adoptOrphans = (pages: Map<number, LegacyPage>, parentOf: Map<number, number | null>) => {
  const placed = [...parentOf.keys()].map((id) => ({ id, segments: titleSegments(pages.get(id)!.title) }));
  for (const page of pages.values()) {
    if (parentOf.has(page.id)) {
      continue;
    }
    const segments = titleSegments(page.title);
    const candidates = placed
      .filter(({ segments: candidate }) => {
        const key = segmentsKey(candidate);
        return candidate.length < segments.length && segmentsKey(segments.slice(0, candidate.length)) === key;
      })
      .sort((first, second) => second.segments.length - first.segments.length);
    parentOf.set(page.id, candidates[0]?.id ?? null);
  }
};

const buildNodes = (pages: Map<number, LegacyPage>, parentOf: Map<number, number | null>): TreeNode[] => {
  const top: TreeNode = { key: 'top', page: null, parent: null, title: '', children: [] };
  const nodes = new Map<number, TreeNode>();
  const nodeFor = (legacyId: number): TreeNode => {
    const existing = nodes.get(legacyId);
    if (existing) {
      return existing;
    }
    const node: TreeNode = {
      key: pageKey(legacyId),
      page: pages.get(legacyId)!,
      parent: null,
      title: '',
      children: [],
    };
    nodes.set(legacyId, node);
    return node;
  };
  const childNamed = (parent: TreeNode, title: string): TreeNode | undefined =>
    parent.children.find((child) => slugify(child.title) === slugify(title));
  const groupUnder = (parent: TreeNode, title: string): TreeNode => {
    const existing = childNamed(parent, title);
    if (existing) {
      return existing;
    }
    const group: TreeNode = { key: `${parent.key}/group:${slugify(title)}`, page: null, parent, title, children: [] };
    parent.children.push(group);
    return group;
  };
  const place = (node: TreeNode, container: TreeNode, title: string) => {
    const emptyGroup = childNamed(container, title);
    node.title = title;
    node.parent = container;
    if (emptyGroup && emptyGroup.page === null) {
      emptyGroup.children.forEach((child) => (child.parent = node));
      node.children.push(...emptyGroup.children);
      container.children[container.children.indexOf(emptyGroup)] = node;
      return;
    }
    container.children.push(node);
  };

  const attach = (legacyId: number) => {
    const node = nodeFor(legacyId);
    const segments = titleSegments(node.page!.title);
    const parentId = parentOf.get(legacyId) ?? null;
    const parentNode = parentId === null ? top : nodeFor(parentId);
    const below =
      parentId === null ? rootSegments(segments) : segmentsBelowParent(segments, titleSegments(parentNode.page!.title));
    place(node, below.slice(0, -1).reduce(groupUnder, parentNode), below[below.length - 1]!);
  };

  const depthOf = (legacyId: number, seen = new Set<number>()): number => {
    const parentId = parentOf.get(legacyId) ?? null;
    if (parentId === null || seen.has(legacyId)) {
      return 0;
    }
    return 1 + depthOf(parentId, seen.add(legacyId));
  };
  const discoveryOrder = new Map([...parentOf.keys()].map((legacyId, index) => [legacyId, index]));
  [...parentOf.keys()]
    .sort(
      (first, second) => depthOf(first) - depthOf(second) || discoveryOrder.get(first)! - discoveryOrder.get(second)!,
    )
    .forEach(attach);
  return top.children;
};

const planNode = (
  node: TreeNode,
  parent: PlannedPage | null,
  sortOrder: number,
  takenSlugs: Set<string>,
): PlannedPage => {
  const isReserved = (candidate: string) =>
    parent === null && (RESERVED_ROOT_SEGMENTS as readonly string[]).includes(candidate);
  const slug = uniqueSlug(node.title, (candidate) => takenSlugs.has(candidate) || isReserved(candidate), 'strona');
  takenSlugs.add(slug);
  const page = node.page;
  return {
    key: node.key,
    parentKey: parent?.key ?? null,
    legacyId: page?.id ?? null,
    legacyTitle: page ? legacyPlainText(page.title) : null,
    title: node.title,
    slug,
    path: parent ? `${parent.path}/${slug}` : slug,
    kind: page ? 'article' : 'hub',
    status: !page || isPublicPage(page) ? 'published' : 'draft',
    commentsEnabled: page?.allowsComments ?? false,
    sortOrder,
  };
};

const flatten = (nodes: TreeNode[], parent: PlannedPage | null): PlannedPage[] => {
  const takenSlugs = new Set<string>();
  return nodes.flatMap((node, index) => {
    const planned = planNode(node, parent, index, takenSlugs);
    return [planned, ...flatten(node.children, planned)];
  });
};

export const planPageTree = (legacyPages: LegacyPage[], navigationRootIds: number[]): PlannedPage[] => {
  const pages = new Map(legacyPages.filter(isMigratablePage).map((page) => [page.id, page]));
  const parentOf = discoverParents(pages, navigationRootIds);
  adoptOrphans(pages, parentOf);
  return flatten(buildNodes(pages, parentOf), null);
};
