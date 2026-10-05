// One structured line per request, outcome only (FR-019, FR-022). Never an IP, a header value,
// a slug, a post text or raw model output. A failure also logs the error name and its message
// truncated to 200 characters: the text of an internal binding or model error, never reader data.
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
  if (error instanceof Error) line.message = error.message.slice(0, 200);
  console.log(JSON.stringify(line));
}
