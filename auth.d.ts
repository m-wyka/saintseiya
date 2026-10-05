import type { ModeratorPermission, UserRole } from './shared/utils/roles';

declare module '#auth-utils' {
  interface User {
    id: number;
    name: string;
    avatarUrl: string | null;
    role: UserRole;
    permissions: ModeratorPermission[];
  }

  interface UserSession {
    loggedInAt?: number;
  }
}

export {};
