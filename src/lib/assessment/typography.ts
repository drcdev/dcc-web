// Curly quotes and the ellipsis, as the site's Markdown processor writes them (smartypants), so
// text rendered from the data file reads exactly as the same text did when it was Markdown prose
// (FR-004). Pure; used by the two text components.
export function typographic(text: string): string {
  const opening = /[\s([{—–“‘]/;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    const before = i === 0 ? " " : text[i - 1]!;
    if (char === '"') out += opening.test(before) ? "“" : "”";
    else if (char === "'") out += opening.test(before) ? "‘" : "’";
    else out += char;
  }
  return out.replaceAll("...", "…");
}
