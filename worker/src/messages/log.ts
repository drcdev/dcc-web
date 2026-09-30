// One outcome-only line per retrieval request (FR-016): never an id, token, caller or content.
export type MessagesOutcome = "listed" | "marked_read" | "already_read" | "not_found" | "invalid_request" | "unauthorized" | "unavailable";

export function log(outcome: MessagesOutcome): void {
  console.log(JSON.stringify({ event: "messages", outcome }));
}
