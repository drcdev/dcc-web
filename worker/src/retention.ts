import { CLEAR_FINGERPRINTS_SQL, DELETE_BATCH, DELETE_EXPIRED_SQL } from "./contact/queries";
import { RETENTION_MONTHS } from "./contact/rules";

const DAY_MS = 86_400_000;
// 40 batches of 500 keep a run inside the 50-query limit of the Free plan; anything left
// is caught by the next run, whose cutoff covers everything overdue.
const MAX_BATCHES = 40;

/** RETENTION_MONTHS calendar months before `now`, in UTC (29 Feb maps to 1 Mar). */
export function retentionCutoff(now: number): number {
  const date = new Date(now);
  date.setUTCMonth(date.getUTCMonth() - RETENTION_MONTHS);
  return date.getTime();
}

/**
 * Deletes messages older than the retention period (any status), then clears the sender
 * fingerprint on rows older than 24 hours. Logs one line with the number deleted and
 * nothing else (FR-016), and rethrows a failure so the cron run shows as errored.
 */
export async function runRetention(db: D1Database, scheduledTime: number): Promise<void> {
  let deleted = 0;
  try {
    const cutoff = retentionCutoff(scheduledTime);
    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const result = await db.prepare(DELETE_EXPIRED_SQL).bind(cutoff).run();
      deleted += result.meta.changes;
      if (result.meta.changes < DELETE_BATCH) break;
    }
    await db
      .prepare(CLEAR_FINGERPRINTS_SQL)
      .bind(scheduledTime - DAY_MS)
      .run();
  } finally {
    console.log(JSON.stringify({ event: "retention", deleted }));
  }
}
