// US1 and FR-080: the story route builds /projects/<slug>/ from a project file
// on the fixture site (contracts/pages-dom.md). Broken bodies are asserted in
// project-body.test.ts (unit) and project-validation.test.ts (build).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const stageIds = ["problem", "constraints", "options", "built", "outcome", "lessons", "invitation"];
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

describe("the story of a valid every-setting project", () => {
  let result: FixtureSiteResult;
  let html = "";
  beforeAll(async () => {
    result = await buildFixtureSite([], { projects: ["every-setting.mdx"] });
    if (result.ok) html = result.read("projects/every-setting/index.html");
  }, 240_000);
  afterAll(() => result?.cleanup());

  it("builds", () => {
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
  });

  it("has one h1 with the title and seven chapters with h2 headings", () => {
    expect(count(html, /<h1[\s>]/g)).toBe(1);
    expect(html).toMatch(/<h1[^>]*>\s*Every setting\s*<\/h1>/);
    expect(count(html, /<h2[\s>]/g)).toBe(7);
  });

  it("has the seven chapters in order, with their ids and numbers", () => {
    const ids = [...html.matchAll(/<section[^>]*\sid="([a-z]+)"[^>]*data-stage="/g)].map((m) => m[1]);
    expect(ids).toEqual(stageIds);
    for (let n = 1; n <= 7; n++) expect(html).toContain(`Chapter ${n} of 7`);
    expect(html).toMatch(/<nav[^>]+aria-label="In this story"/);
  });

  it("links the invitation to the contact form with the project", () => {
    expect(html).toContain('href="/contact/?project=every-setting"');
  });

  it("carries its own title, description, canonical and sharing image (FR-080)", () => {
    expect(html).toMatch(/<title>Every setting · [^<]+<\/title>/);
    expect(html).toContain('content="A project file that uses every setting."');
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/projects\/every-setting\/"/);
    expect(html).toMatch(/<meta[^>]+property="og:title"[^>]+content="Every setting"/);
    expect(html).toMatch(/<meta[^>]+property="og:image"[^>]+content="[^"]*\/_astro\/[^"]+\.png"/);
    expect(html).toMatch(/<meta[^>]+property="og:image:alt"[^>]+content="A sharing image"/);
  });

  it("is not a draft, so shows no draft notice", () => {
    expect(html).not.toContain("data-draft-notice");
  });

  it("ships no page script beyond the shell's", () => {
    const about = result.read("about/index.html");
    const scripts = (page: string) => count(page, /<script\b/g);
    expect(scripts(html)).toBe(scripts(about));
  });
});
