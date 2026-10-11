// The six-week plan order (specs/037 FR-010). Weeks 1 to 5 are the five shifts from the lowest
// sum to the highest; a tie keeps the post's order. Pure and shared by the browser module and the
// unit tests.

/** The shift positions in plan order. A stable sort keeps tied shifts in the post's order. */
export const planOrder = (sums: readonly number[]): number[] =>
  sums.map((sum, position) => ({ sum, position })).sort((a, b) => a.sum - b.sum || a.position - b.position).map(({ position }) => position);
