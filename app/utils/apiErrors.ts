interface ApiErrorPayload {
  statusMessage?: string;
  message?: string;
  data?: { issues?: { message?: string }[] };
}

const DEFAULT_ERROR_MESSAGE = 'Coś poszło nie tak. Spróbuj ponownie.';

const payloadOf = (error: unknown): ApiErrorPayload | null =>
  typeof error === 'object' && error !== null && 'data' in error
    ? ((error as { data?: ApiErrorPayload }).data ?? null)
    : null;

export const apiErrorMessage = (error: unknown): string => {
  const payload = payloadOf(error);
  return payload?.data?.issues?.[0]?.message || payload?.statusMessage || payload?.message || DEFAULT_ERROR_MESSAGE;
};
