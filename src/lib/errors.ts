import type { Messages } from '@/i18n/sv';

/** Error codes raised by our Postgres functions (`raise exception '<code>'`). */
const KNOWN = [
  'forbidden',
  'last_owner',
  'transfer_ownership_required',
  'invite_email_mismatch',
  'invite_expired',
  'invite_used',
  'invite_not_found',
] as const;

export type KnownErrorCode = (typeof KNOWN)[number] | 'duplicate' | 'session_expired';

interface PgLikeError {
  message?: string;
  code?: string;
  status?: number;
}

export function errorCode(error: unknown): KnownErrorCode | null {
  const e = (error ?? {}) as PgLikeError;
  const message = e.message ?? '';
  const known = KNOWN.find((k) => message.includes(k));
  if (known) return known;
  if (e.code === '23505') return 'duplicate';
  if (e.code === 'PGRST301' || e.status === 401) return 'session_expired';
  return null;
}

export function isNetworkError(error: unknown): boolean {
  const message = (error as PgLikeError)?.message ?? '';
  return error instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(message);
}

/** A user-facing message for any thrown value. */
export function describeError(error: unknown, t: Messages): string {
  const code = errorCode(error);
  if (code) return t.errors[code];
  if (isNetworkError(error)) return t.common.networkError;
  return t.common.somethingWentWrong;
}

/** Unwraps a Supabase response, throwing its error. */
export function must<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}
