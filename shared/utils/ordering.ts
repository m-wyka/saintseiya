export const MOVE_DIRECTIONS = ['previous', 'next'] as const;
export type MoveDirection = (typeof MOVE_DIRECTIONS)[number];

export const withMovedItem = <Item>(items: Item[], index: number, direction: MoveDirection): Item[] => {
  const neighbourIndex = direction === 'previous' ? index - 1 : index + 1;
  const item = items[index];
  const neighbour = items[neighbourIndex];
  if (item === undefined || neighbour === undefined) {
    return items;
  }
  const reordered = [...items];
  reordered[index] = neighbour;
  reordered[neighbourIndex] = item;
  return reordered;
};
