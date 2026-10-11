// The statement set version (specs/037-wayfinder-self-assessment/research.md R5; FR-014): the first
// eight hex digits of a SHA-256 over each shift's id and statements in order. Any statement edit,
// even a typo, and any reordering changes it; titles, intro, labels, shift names, From/To, the
// moved Practical Application and week text do not. A result made with another version cannot be
// compared with a new one.
import { createHash } from "node:crypto";

export function statementSetVersion(shifts: readonly { id: string; statements: readonly string[] }[]): string {
  return createHash("sha256")
    .update(JSON.stringify(shifts.map((shift) => [shift.id, shift.statements])))
    .digest("hex")
    .slice(0, 8);
}
