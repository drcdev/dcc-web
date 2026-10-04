// One structured line per request, outcome only (FR-019, FR-022). Never an IP, a header value,
// a slug, a post text or raw model output.
export type QuestionsOutcome =
  | "cached"
  | "generated"
  | "fresh"
  | "forbidden"
  | "invalid"
  | "not_found"
  | "stale"
  | "limited"
  | "unavailable"
  | "malformed";

export function logOutcome(outcome: QuestionsOutcome, error?: unknown): void {
  const line: Record<string, string> = { event: "questions", outcome };
  // The error class tells a persistent model failure from a transient one (research R5).
  if (error !== undefined) line.name = error instanceof Error ? error.name : "UnknownError";
  console.log(JSON.stringify(line));
}
