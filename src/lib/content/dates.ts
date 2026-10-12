// The raw-date checks shared by posts (`date`, `updated`) and the Now entry (`updated`). Astro's
// glob loader parses front matter with js-yaml, which turns an impossible date such as 2026-02-30
// into 2 March, so these checks read the date as the text the author wrote: YYYY-MM-DD, a real
// calendar day, and (for Now) not after the build date in UTC. The clock is a parameter so tests
// can fix it.

const SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written YYYY-MM-DD. */
export function isRealDate(value: string): boolean {
  const match = SHAPE.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** True when the YYYY-MM-DD day is later than `now`'s day in UTC. The build date itself passes. */
export function isAfterBuildDate(value: string, now: Date = new Date()): boolean {
  return value > now.toISOString().slice(0, 10);
}

/**
 * The problem with a raw date, as text for a build error, or null when it is fine: a real
 * YYYY-MM-DD day that is not after the build date.
 */
export function rawDateProblem(value: string, now: Date = new Date()): string | null {
  if (!isRealDate(value)) {
    return `must be a real date written YYYY-MM-DD with no quotes or time. Found ${value === "" ? "(nothing)" : value}.`;
  }
  if (isAfterBuildDate(value, now)) return `(${value}) is in the future. Use today's date or earlier.`;
  return null;
}
