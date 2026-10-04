// The character set the self-hosted Inter files ship, and the system font stack used as the
// fallback. No imports, so astro.config.mjs, the subset script and the tests can all load it.

/** CSS `unicode-range` tokens for the shipped set: ASCII, Latin-1, typographic marks, → ✓ ✗. */
export const INTER_UNICODE_RANGE: readonly string[] = [
  "U+0020-007E",
  "U+00A0-00FF",
  "U+2013",
  "U+2014",
  "U+2018",
  "U+2019",
  "U+201C",
  "U+201D",
  "U+2022",
  "U+2026",
  "U+2192",
  "U+2713",
  "U+2717",
];

/** Expands `unicode-range` tokens (`U+41`, `U+41-5A`) to a set of code points. */
export function codePointsOf(range: readonly string[]): Set<number> {
  const points = new Set<number>();
  for (const token of range) {
    const match = /^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/.exec(token.trim());
    if (!match) throw new Error(`Not a unicode-range token: ${token}`);
    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    for (let cp = start; cp <= end; cp++) points.add(cp);
  }
  return points;
}

/** Inside the range but absent from Inter's cmap: U+00AD SOFT HYPHEN is never drawn as a glyph. */
export const NOT_IN_INTER: readonly number[] = [0x00ad];

/** Today's system families, none added or removed, with the generic `sans-serif` last. */
export const SYSTEM_FONT_STACK: readonly string[] = [
  "ui-sans-serif",
  "system-ui",
  "-apple-system",
  "Segoe UI",
  "Roboto",
  "Helvetica",
  "Arial",
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "sans-serif",
];
