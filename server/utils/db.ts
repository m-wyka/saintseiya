import { getDb, schema } from '../db';

export { schema };

export const useDb = () => getDb(useRuntimeConfig().dbPath);
