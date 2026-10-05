// The cached question sets (data-model section 2). Statements live in queries.ts.
import { DELETE_OTHER_HASHES_SQL, GET_SET_SQL, INSERT_SET_SQL } from "./queries";

/** The cached questions for one post version, or null. A stored row that no longer parses counts as a miss. */
export async function getSet(db: D1Database, slug: string, hash: string): Promise<string[] | null> {
  const row = await db.prepare(GET_SET_SQL).bind(slug, hash).first<{ questions: string }>();
  if (!row) return null;
  try {
    const parsed: unknown = JSON.parse(row.questions);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

/** Stores a set (first write wins) and removes the slug's sets for other hashes, in one batch. */
export async function storeSet(
  db: D1Database,
  slug: string,
  hash: string,
  questions: string[],
  model: string,
): Promise<void> {
  await db.batch([
    db.prepare(INSERT_SET_SQL).bind(slug, hash, JSON.stringify(questions), model, Date.now()),
    db.prepare(DELETE_OTHER_HASHES_SQL).bind(slug, hash),
  ]);
}
