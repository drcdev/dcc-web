// The site-wide token bucket (data-model section 3). One row in `usage_bucket`; a take is one
// atomic `UPDATE ... RETURNING`, so two concurrent requests cannot both spend the last token.
import { BUCKET_CAPACITY, BUCKET_REFILL_PER_DAY } from "./config";

export interface BucketLimits {
  capacity: number;
  perDay: number;
}

export type TakeResult = { ok: true } | { ok: false; retryAfter: number };

const DEFAULT_LIMITS: BucketLimits = { capacity: BUCKET_CAPACITY, perDay: BUCKET_REFILL_PER_DAY };
const MS_PER_DAY = 86_400_000;
/** What a misconfigured (non-positive or non-finite) bucket asks callers to wait, in seconds. */
const MISCONFIGURED_RETRY_AFTER = 3_600;

const usable = (n: number) => Number.isFinite(n) && n > 0;

// ?1 capacity, ?2 now, ?3 tokens per ms. A clock that runs backwards adds no tokens.
const AVAILABLE = "MIN(?1, tokens + MAX(0, ?2 - updated_at) * ?3)";
const TAKE_SQL = `UPDATE usage_bucket SET tokens = ${AVAILABLE} - 1, updated_at = ?2 WHERE id = 1 AND ${AVAILABLE} >= 1 RETURNING tokens`;
const PEEK_SQL = `SELECT ${AVAILABLE} AS available FROM usage_bucket WHERE id = 1`;
const REFUND_SQL = "UPDATE usage_bucket SET tokens = MIN(?1, tokens + 1) WHERE id = 1";

/** Spends one token if the refilled bucket holds one; otherwise says how long to wait. */
export async function takeToken(db: D1Database, now: number, limits: BucketLimits = DEFAULT_LIMITS): Promise<TakeResult> {
  if (!usable(limits.capacity) || !usable(limits.perDay)) return { ok: false, retryAfter: MISCONFIGURED_RETRY_AFTER };
  const perMs = limits.perDay / MS_PER_DAY;
  const taken = await db.prepare(TAKE_SQL).bind(limits.capacity, now, perMs).first();
  if (taken) return { ok: true };
  const peek = await db.prepare(PEEK_SQL).bind(limits.capacity, now, perMs).first<{ available: number }>();
  const available = peek?.available ?? 0;
  const seconds = Math.ceil((1 - available) / (perMs * 1000));
  return { ok: false, retryAfter: Math.max(1, seconds) };
}

/** Gives a token back after a failure that was not the caller's doing. Never throws: on failure the token stays spent. */
export async function refundToken(db: D1Database, capacity: number = BUCKET_CAPACITY): Promise<void> {
  if (!usable(capacity)) return;
  try {
    await db.prepare(REFUND_SQL).bind(capacity).run();
  } catch {
    // The token stays spent (data-model section 3).
  }
}
