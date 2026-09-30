import { RATE_LIMIT_SQL } from "./queries";
import { RATE_PER_DAY, RATE_PER_HOUR } from "./rules";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export type RateLimitResult = { limited: false } | { limited: true; retryAfter: number };

interface CountRow {
  day: number;
  hour: number;
  oldest_day: number | null;
  oldest_hour: number | null;
}

/**
 * Counts the sender's stored messages in the rolling hour and day (exact, from D1).
 * Refused submissions are never stored, so they never count (FR-013a). Throws when D1
 * fails; the caller turns that into a fail-closed 503 (FR-012a).
 */
export async function checkRateLimit(db: D1Database, ipHash: string, now: number): Promise<RateLimitResult> {
  const row = await db
    .prepare(RATE_LIMIT_SQL)
    .bind(ipHash, now - HOUR_MS, now - DAY_MS)
    .first<CountRow>();
  if (!row) return { limited: false };

  // The sender may send again once every exceeded window has room, so wait for the longest.
  let waitMs = 0;
  if (row.hour >= RATE_PER_HOUR && row.oldest_hour !== null) waitMs = Math.max(waitMs, row.oldest_hour + HOUR_MS - now);
  if (row.day >= RATE_PER_DAY && row.oldest_day !== null) waitMs = Math.max(waitMs, row.oldest_day + DAY_MS - now);
  const limited = row.hour >= RATE_PER_HOUR || row.day >= RATE_PER_DAY;
  return limited ? { limited: true, retryAfter: Math.max(1, Math.ceil(waitMs / 1000)) } : { limited: false };
}
