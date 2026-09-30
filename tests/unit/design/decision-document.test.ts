// Decision document checks for the blog design directions (contracts/decision-document.md;
// FR-003, FR-012, FR-019 to FR-021, SC-005). Prototype-only: deleted in the removal task.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DOC = "docs/design/blog.md";
const IMAGES = "docs/design/blog";
const text = existsSync(DOC) ? readFileSync(DOC, "utf8") : "";

const DIRECTIONS = [
  { id: "a", heading: "Direction A: Front page", name: "Direction A" },
  { id: "b", heading: "Direction B: Timeline", name: "Direction B" },
  { id: "c", heading: "Direction C: Topic hubs", name: "Direction C" },
] as const;
const SUBSECTIONS = [
  "Summary",
  "Preview",
  "Pictures",
  "How topics are presented",
  "Proposed addresses",
  "When no post is featured",
  "New colours or fonts",
  "Trade-offs",
];
const SCREENS = ["landing", "listing", "post"];
const WIDTHS = ["phone", "desktop"];
const THEMES = ["dark", "light"];

/** The body of a `## ` section, up to the next `## ` heading. */
function section(heading: string): string {
  const start = text.split("\n").findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) throw new Error(`Missing section "${heading}"`);
  const rest = text.split("\n").slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

/** The body of a `### ` sub-section inside a direction section. */
function sub(direction: string, name: string): string {
  const lines = section(direction).split("\n");
  const start = lines.findIndex((line) => line.trim() === `### ${name}`);
  if (start < 0) throw new Error(`Missing sub-section "${name}" in "${direction}"`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("### "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

describe("docs/design/blog.md", () => {
  it("exists", () => {
    expect(existsSync(DOC)).toBe(true);
  });

  for (const d of DIRECTIONS) {
    describe(d.heading, () => {
      it("has all eight sub-sections", () => {
        for (const name of SUBSECTIONS) expect(() => sub(d.heading, name), name).not.toThrow();
      });

      it("references 12 existing pictures with alt text naming direction, screen, width and theme", () => {
        const refs = [...sub(d.heading, "Pictures").matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
        expect(refs).toHaveLength(12);
        const expected = new Set<string>();
        for (const screen of SCREENS)
          for (const width of WIDTHS)
            for (const theme of THEMES) expected.add(`blog/${d.id}-${screen}-${width}-${theme}.jpg`);
        expect(new Set(refs.map((r) => r[2]))).toEqual(expected);
        for (const [, alt, path] of refs) {
          expect(existsSync(`docs/design/${path}`), path).toBe(true);
          const [, screen, width, theme] = path!.replace(/\.jpg$/, "").split("/")[1]!.split("-");
          const lower = alt!.toLowerCase();
          expect(alt).toContain(d.name);
          expect(lower).toContain(screen!);
          expect(lower).toContain(width!);
          expect(lower).toContain(theme!);
        }
      });

      it("states that renaming, merging or splitting topics changes no post address", () => {
        const addresses = sub(d.heading, "Proposed addresses").toLowerCase().replace(/\s+/g, " ");
        expect(addresses).toMatch(/renaming, merging or splitting topics/);
        expect(addresses).toMatch(/changes no post address/);
      });

      it("names all six trade-off dimensions", () => {
        const trade = sub(d.heading, "Trade-offs").toLowerCase();
        for (const dimension of [
          "reading experience",
          "number of posts",
          "build effort",
          "renaming, merging or splitting topics",
          "feature images",
          "phone",
        ])
          expect(trade, dimension).toContain(dimension);
      });
    });
  }

  it("has an overview table with a row per axis and a column per direction", () => {
    const rows = section("How to compare")
      .split("\n")
      .filter((line) => line.startsWith("|"));
    const header = rows[0]!.toLowerCase();
    for (const d of DIRECTIONS) expect(header).toContain(d.heading.split(": ")[1]!.toLowerCase());
    const first = rows.map((r) => r.split("|")[1]!.trim().toLowerCase());
    for (const axis of ["grouping", "landing order", "featured posts", "page layout", "topic presentation"])
      expect(
        first.some((cell) => cell.includes(axis)),
        axis,
      ).toBe(true);
    for (const row of rows) expect(row.split("|").length - 2).toBe(4);
  });

  it("ends with an empty Decision section", () => {
    const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings.at(-1)).toBe("Decision");
    const lines = section("Decision")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines).toEqual(["Chosen direction:", "Notes:"]);
  });

  it("has 36 JPEGs under about 6 MB in total", () => {
    const files = existsSync(IMAGES) ? readdirSync(IMAGES).filter((f) => f.endsWith(".jpg")) : [];
    expect(files).toHaveLength(36);
    const total = files.reduce((sum, f) => sum + statSync(`${IMAGES}/${f}`).size, 0);
    expect(total).toBeLessThan(6.2 * 1024 * 1024);
  });
});
