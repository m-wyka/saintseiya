import { parseMessageKey } from '#shared/utils/messages';

interface ApiErrorPayload {
  statusMessage?: string;
  message?: string;
  data?: { issues?: { message?: string }[] };
}

const DEFAULT_ERROR_KEY = 'ERRORS.UNEXPECTED';

const payloadOf = (error: unknown): ApiErrorPayload | null =>
  typeof error === 'object' && error !== null && 'data' in error
    ? ((error as { data?: ApiErrorPayload }).data ?? null)
    : null;

export const translateMessage = (text: string): string => {
  const message = parseMessageKey(text);
  return message ? useNuxtApp().$i18n.t(message.key, message.params) : text;
};

export const apiErrorMessage = (error: unknown): string => {
  const payload = payloadOf(error);
  return translateMessage(
    payload?.data?.issues?.[0]?.message || payload?.statusMessage || payload?.message || DEFAULT_ERROR_KEY,
  );
};
