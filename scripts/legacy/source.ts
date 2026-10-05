import { createConnection } from 'mysql2/promise';
import type { Connection, RowDataPacket } from 'mysql2/promise';

const LEGACY_TEXT_ENCODING = 'iso-8859-2';
const TEXT_COLUMN_TYPES = new Set(['VAR_STRING', 'STRING', 'BLOB', 'TINY_BLOB', 'MEDIUM_BLOB', 'LONG_BLOB', 'VARCHAR']);

const legacyTextDecoder = new TextDecoder(LEGACY_TEXT_ENCODING);

export const decodeLegacyBytes = (bytes: Uint8Array): string => legacyTextDecoder.decode(bytes);

export interface LegacySource {
  rows: <Row extends object>(query: string) => Promise<Row[]>;
  close: () => Promise<void>;
}

const connect = (): Promise<Connection> =>
  createConnection({
    host: process.env.LEGACY_DB_HOST || '127.0.0.1',
    port: Number(process.env.LEGACY_DB_PORT || 3399),
    user: process.env.LEGACY_DB_USER || 'root',
    password: process.env.LEGACY_DB_PASSWORD || '',
    database: process.env.LEGACY_DB_NAME || 'saintseiya_legacy',
    charset: 'latin1',
    typeCast: (field, next) => {
      if (!TEXT_COLUMN_TYPES.has(field.type)) {
        return next();
      }
      const bytes = field.buffer();
      return bytes === null ? null : decodeLegacyBytes(bytes);
    },
  });

export const openLegacySource = async (): Promise<LegacySource> => {
  const connection = await connect();
  return {
    rows: async <Row extends object>(query: string) => {
      const [rows] = await connection.query<RowDataPacket[]>(query);
      return rows as Row[];
    },
    close: () => connection.end(),
  };
};
