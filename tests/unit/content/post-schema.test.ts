// Unit tests for the post collection schema (data-model.md "Post"; FR-031 to
// FR-033; research R1). Spike 3 (tasks.md T005): how dates written in front
// matter behave through the repository's own content YAML parser. Astro's glob
// loader parses front matter with `parseFrontmatter()` from
// `@astrojs/internal-helpers/frontmatter`, so the same function is used here.
// T008 extends this file with the full schema cases.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";

// `@astrojs/internal-helpers` is Astro's own dependency, so resolve it from Astro.
const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { parseFrontmatter } = (await import(
  pathToFileURL(fromAstro.resolve("@astrojs/internal-helpers/frontmatter")).href
)) as { parseFrontmatter: (code: string) => { frontmatter: Record<string, unknown>; rawFrontmatter: string } };

const dateSchema = z.object({ date: z.date() });
const parse = (value: string) => dateSchema.safeParse(parseFrontmatter(`---\ndate: ${value}\n---\n`).frontmatter);

describe("post date front matter (spike: minimal z.date() schema)", () => {
  it("accepts a YAML date written YYYY-MM-DD", () => {
    const result = parse("2026-08-27");
    expect(result.success).toBe(true);
    expect(result.data?.date.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("rejects a quoted date", () => {
    expect(parse('"2026-08-27"').success).toBe(false);
  });

  it("rejects 27/08/2026", () => {
    expect(parse("27/08/2026").success).toBe(false);
  });

  it("rejects next tuesday", () => {
    expect(parse("next tuesday").success).toBe(false);
  });

  it("accepts a timestamp at the schema level, so a separate check must reject it (FR-031)", () => {
    // z.date() alone cannot tell a date from a timestamp; the post schema
    // compares the raw text (R1).
    const result = parse("2026-08-27T10:30:00Z");
    expect(result.success).toBe(true);
  });

  it("rolls 2026-02-30 over to 2 March, so a raw-text check is needed (R1 fallback)", () => {
    const result = parse("2026-02-30");
    expect(result.success).toBe(true);
    expect(result.data?.date.toISOString().slice(0, 10)).toBe("2026-03-02");
  });
});
