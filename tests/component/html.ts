// Minimal, dependency-free helpers for asserting on the HTML the Astro
// Container API returns. They scan opening tags and their attributes; they are
// not a general HTML parser, but Astro's rendered output is regular enough
// (quoted attributes, no `>` inside attribute values in these components).

export interface Tag {
  name: string;
  attrs: Record<string, string>;
  /** Offset of the tag's `<` in the source HTML. */
  index: number;
  /** The raw opening tag text. */
  raw: string;
}

const TAG_PATTERN = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g;
const ATTR_PATTERN = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

function decode(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Removes the bodies of <script> and <style> elements so their text is not scanned as markup. */
function blankRawText(html: string): string {
  return html.replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (_m, open, _n, body: string, close) =>
    open + " ".repeat(body.length) + close,
  );
}

export function tags(html: string): Tag[] {
  const source = blankRawText(html);
  const result: Tag[] = [];
  for (const match of source.matchAll(TAG_PATTERN)) {
    const attrs: Record<string, string> = {};
    for (const a of (match[2] ?? "").matchAll(ATTR_PATTERN)) {
      attrs[a[1]!.toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? "");
    }
    result.push({ name: match[1]!.toLowerCase(), attrs, index: match.index!, raw: match[0] });
  }
  return result;
}

export function byName(html: string, name: string): Tag[] {
  return tags(html).filter((t) => t.name === name);
}

/** Returns the text inside the first element with this tag name, tags stripped and whitespace collapsed. */
export function textOf(html: string, name: string): string | null {
  const match = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(html);
  if (!match) return null;
  return decode(match[1]!.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

export function meta(html: string, key: "name" | "property", value: string): Tag[] {
  return byName(html, "meta").filter((t) => t.attrs[key] === value);
}

export function classList(tag: Tag): string[] {
  return (tag.attrs.class ?? "").split(/\s+/).filter(Boolean);
}

const FOCUSABLE = new Set(["a", "button", "input", "select", "textarea", "summary", "iframe"]);

/** Tags that take part in sequential focus order, in source order. */
export function focusable(html: string): Tag[] {
  return tags(html).filter((t) => {
    if ("disabled" in t.attrs) return false;
    const tabindex = t.attrs.tabindex;
    if (tabindex !== undefined) return Number(tabindex) >= 0;
    if (t.name === "a") return "href" in t.attrs;
    return FOCUSABLE.has(t.name);
  });
}
