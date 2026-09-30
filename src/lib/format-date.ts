// Dates as the blog shows them. Post dates are written YYYY-MM-DD in a post's
// settings and parsed as midnight UTC, so they are formatted in UTC: a reader in
// any time zone sees the day the post names.

const longDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** `August 27, 2026` */
export function formatDate(date: Date): string {
  return longDate.format(date);
}

/** `2026-08-27`, for `<time datetime>`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
