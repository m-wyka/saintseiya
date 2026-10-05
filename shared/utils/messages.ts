export type MessageParams = Record<string, string | number>;

const MESSAGE_PATTERN = /^([A-Z][A-Z0-9_]*\.[A-Z0-9_]+)(?: (\{.*\}))?$/s;

export const messageKey = (key: string, params?: MessageParams): string =>
  params ? `${key} ${JSON.stringify(params)}` : key;

export const parseMessageKey = (text: string): { key: string; params: MessageParams } | null => {
  const [, key, serializedParams] = MESSAGE_PATTERN.exec(text) ?? [];
  if (!key) {
    return null;
  }
  return { key, params: serializedParams ? (JSON.parse(serializedParams) as MessageParams) : {} };
};
