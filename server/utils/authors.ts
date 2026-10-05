import { schema } from './db';

export const authorColumns = {
  id: schema.users.id,
  name: schema.users.name,
  isGhost: schema.users.isGhost,
  avatarUrl: schema.users.avatarUrl,
};
