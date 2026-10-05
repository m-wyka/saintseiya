import type { H3Event } from 'h3';
import type { User } from '#auth-utils';
import { isStaff } from '#shared/utils/roles';

export type Viewer = User | null;

export const viewerOf = async (event: H3Event): Promise<Viewer> => {
  const { user } = await getUserSession(event);
  const account = user ? findActiveAccount(user.id) : null;
  return account ? sessionUserOf(account) : null;
};

export const seesStaffContent = (viewer: Viewer): boolean => isStaff(viewer);
