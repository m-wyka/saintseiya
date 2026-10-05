import { withMovedItem } from '#shared/utils/ordering';
import type { MoveDirection } from '#shared/utils/ordering';

export const movedOrder = (orderedIds: number[], movedId: number, direction: MoveDirection): number[] =>
  withMovedItem(orderedIds, orderedIds.indexOf(movedId), direction);
