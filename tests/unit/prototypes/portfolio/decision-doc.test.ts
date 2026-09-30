// The decision document (contracts/decision-document.md; FR-040 to FR-049).
// Placeholder mode: the pinned-SHA assertion runs only once the URLs are filled in (Phase 9).
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DOC = "docs/design/portfolio.md";
const doc = readFileSync(DOC, "utf8");
const placeholderMode = doc.includes("PINNED_URL_PLACEHOLDER");

/** The text of a `## ` section, from its heading to the next `## ` heading. */
function section(heading: string): string {
  const start = doc.indexOf(`\n## ${heading}`);
  if (start < 0) throw new Error(`Missing section: ${heading}`);
  const rest = doc.slice(start + 1);
  const next = rest.slice(3).search(/\n## /);
  return next < 0 ? rest : rest.slice(0, next + 3);
}

const DIRECTIONS = [
  { key: "a", letter: "A", name: "Timeline" },
  { key: "b", letter: "B", name: "Cards" },
  { key: "c", letter: "C", name: "Chapters" },
];

describe("decision document", () => {
  it("has the title and the three direction headings", () => {
    expect(doc).toMatch(/^# Portfolio design directions$/m);
    for (const d of DIRECTIONS) expect(doc).toMatch(new RegExp(`^## Direction ${d.letter}: ${d.name}$`, "m"));
  });

  for (const d of DIRECTIONS) {
    describe(`Direction ${d.letter}`, () => {
      const body = () => section(`Direction ${d.letter}: ${d.name}`);

      it("labels the four behaviours, each covering reduced motion and JavaScript off", () => {
        for (const label of ["Story stages", "Option comparison", "Demo embeds", "Scroll reveals"]) {
          const m = body().match(new RegExp(`^\\*\\*${label}\\.\\*\\*(.*)$`, "m"));
          expect(m, `${label} paragraph`).not.toBeNull();
          expect(m![1]).toMatch(/reduced motion/i);
          expect(m![1]).toMatch(/JavaScript (is )?off/i);
          if (label === "Demo embeds") expect(m![1]).toMatch(/embedded|linked/i);
        }
      });

      it("covers trade-offs: does well, does poorly, effort and risks", () => {
        const b = body();
        expect(b).toMatch(/^### Trade-offs$/m);
        for (const label of ["Does well", "Does poorly", "Build and maintenance effort", "Risks"]) {
          expect(b).toMatch(new RegExp(`^\\*\\*${label}\\.\\*\\*`, "m"));
        }
      });

      it('has a New visual resources section reading "None." or a list', () => {
        const m = body().match(/^### New visual resources\n\n([\s\S]*?)(?=\n### |\n## |$)/m);
        expect(m).not.toBeNull();
        expect(m![1].trim()).toMatch(/^(None\.|- )/);
      });

      it("has preview links to its index and story", () => {
        expect(body()).toContain(`/design/portfolio/${d.key}/`);
        expect(body()).toContain(`/design/portfolio/${d.key}/focus-pocus/`);
      });
    });
  }

  it("has a Comparison table with exactly the eight rows", () => {
    const rows = section("Comparison")
      .split("\n")
      .filter((l) => l.startsWith("|"))
      .slice(2)
      .map((l) => l.split("|")[1].trim());
    expect(rows).toEqual([
      "Fit with the site's current look",
      "How clearly the options are shown",
      "Reading on a phone",
      "Accessibility risk",
      "JavaScript shipped",
      "Behaviour without scroll-driven animations or view transitions",
      "Demo embedded or linked",
      "Effort to build and maintain for real",
    ]);
  });

  it("does not rank, score or recommend (FR-041)", () => {
    const withoutDecision = doc.slice(0, doc.indexOf("\n## Decision"));
    expect(withoutDecision).not.toMatch(/recommend|\bbest\b|winner|\bscor(e|es|ed|ing)\b|\brank(s|ed|ing)?\b|\bpreferred\b|\bfavou?rite\b/i);
  });

  it("has the Contact hand-off section", () => {
    const s = section("Contact hand-off");
    expect(s).toContain("/contact/?project=");
    // The contract lives under the feature's spec folder; the CI drift guard forbids naming
    // skip-safe paths in checks, so only the contract's own path segment is asserted.
    expect(s).toContain("contracts/contact-handoff.md");
  });

  it("embeds exactly 24 images that exist, with alt text naming direction, page, width and theme", () => {
    const images = [...doc.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    expect(images).toHaveLength(24);
    for (const [, alt, path] of images) {
      const file = path.match(/^portfolio\/([abc])-(index|story)-(phone|desktop)-(light|dark)\.webp$/);
      expect(file, path).not.toBeNull();
      expect(existsSync(`docs/design/${path}`), path).toBe(true);
      const [, dir, page, width, theme] = file!;
      expect(alt).toMatch(new RegExp(`Direction ${dir.toUpperCase()}`));
      expect(alt).toMatch(new RegExp(page, "i"));
      expect(alt).toMatch(new RegExp(width, "i"));
      expect(alt).toMatch(new RegExp(theme, "i"));
    }
  });

  it("leaves the Decision section as only the comment (FR-041)", () => {
    const s = section("Decision");
    expect(s.replace(/^## Decision\s*/, "").trim()).toBe(
      "<!-- Don: record the chosen direction and any changes here. -->",
    );
  });

  it("discloses the draft content, placeholder media and stand-in demo link (FR-049)", () => {
    const intro = doc.slice(0, doc.indexOf("\n## Preview addresses"));
    expect(intro).toMatch(/draft/i);
    expect(intro).toMatch(/placeholder/i);
    expect(intro).toMatch(/screenshots? and (demo )?clips?/i);
    expect(intro).toMatch(/no live demo/i);
    expect(intro).toMatch(/stands? in/i);
  });

  it("has the pinned-to-commit sentence and Cloudflare version retention (FR-046, FR-047)", () => {
    const s = section("Preview addresses");
    expect(s).toMatch(/pinned to commit/);
    expect(s).toMatch(/Cloudflare keeps a limited number of versions/);
    expect(s).toMatch(/screenshots are the lasting record/);
  });

  it.skipIf(placeholderMode)("has real pinned URLs and a 7 to 40 character SHA", () => {
    expect(doc).toMatch(/pinned to commit `?[0-9a-f]{7,40}`?/);
    expect(doc).not.toContain("PINNED_SHA_PLACEHOLDER");
  });

  it("does not reference the blog design work", () => {
    expect(doc).not.toMatch(/docs\/design\/blog|design\/blog/);
  });
});
