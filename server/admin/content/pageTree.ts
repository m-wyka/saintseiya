export interface PageNode {
  id: number;
  parentId: number | null;
  slug: string;
}

export interface PagePath {
  id: number;
  path: string;
}

export const pagePath = (parentPath: string | null, slug: string): string =>
  parentPath ? `${parentPath}/${slug}` : slug;

export const pathPrefixes = (path: string): string[] =>
  path.split('/').map((_, index, segments) => segments.slice(0, index + 1).join('/'));

export const isInsideSubtree = (nodes: PageNode[], subtreeRootId: number, candidateId: number | null): boolean => {
  const parentIdOf = new Map(nodes.map((node) => [node.id, node.parentId]));
  const visitedIds = new Set<number>();
  let currentId = candidateId;
  while (currentId !== null && !visitedIds.has(currentId)) {
    if (currentId === subtreeRootId) {
      return true;
    }
    visitedIds.add(currentId);
    currentId = parentIdOf.get(currentId) ?? null;
  }
  return false;
};

export const descendantPaths = (nodes: PageNode[], pageId: number, path: string): PagePath[] =>
  nodes
    .filter((node) => node.parentId === pageId)
    .flatMap((child) => {
      const childPath = pagePath(path, child.slug);
      return [{ id: child.id, path: childPath }, ...descendantPaths(nodes, child.id, childPath)];
    });
