// Scoring for the self-assessment (specs/037 data-model.md "Result"; FR-005, FR-007). Pure and
// shared by the browser module and the unit tests. A shift's answers are kept as a sum of three
// answers (3 to 15); comparing sums avoids floating-point edge cases at a mean of exactly 3.

export type Band = "low" | "middle" | "high";

export interface ShiftWording {
  name: string;
  from: string;
  to: string;
}

export const sumOf = (answers: readonly number[]): number => answers.reduce((total, value) => total + value, 0);

/** The mean of a shift's three answers, 1 to 5. */
export const scoreOf = (sum: number): number => sum / 3;

/** The mean to one decimal, for example `2.3`. */
export const formatScore = (sum: number): string => scoreOf(sum).toFixed(1);

/** Low below a mean of 3, middle at exactly 3, high above. */
export const band = (sum: number): Band => (sum < 9 ? "low" : sum === 9 ? "middle" : "high");

export function bandPhrase(shift: ShiftWording, sum: number): string {
  const position = band(sum);
  if (position === "low") return `nearer 'From' (${shift.from})`;
  if (position === "high") return `nearer 'To' (${shift.to})`;
  return "in the middle";
}

/** `Name: 2.3 of 5, nearer 'From' (...)`: the text equivalent of one chart row. */
export const summaryLine = (shift: ShiftWording, sum: number): string =>
  `${shift.name}: ${formatScore(sum)} of 5, ${bandPhrase(shift, sum)}`;

/** Where the marker sits along the track, 0 at the From end and 1 at the To end: `(mean - 1) / 4`. */
export const markerPosition = (sum: number): number => (scoreOf(sum) - 1) / 4;

/** The change in the mean between two results of the same statement set: `up 0.7`, `down 0.3` or `no change`. */
export function changeText(earlierSum: number, newSum: number): string {
  const change = (newSum - earlierSum) / 3;
  if (change === 0) return "no change";
  return `${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}`;
}

/** The positions of the shifts in the low band (a mean below 3), in the post's order (FR-008). */
export const selectLowBand = (sums: readonly number[]): number[] => sums.flatMap((sum, i) => (band(sum) === "low" ? [i] : []));

/** The position of the lowest-scoring shift; the first in the post's order on a tie (FR-008). */
export const nextToPractise = (sums: readonly number[]): number => sums.reduce((lowest, sum, i) => (sum < sums[lowest]! ? i : lowest), 0);
