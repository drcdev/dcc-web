// Build tests (layer: build; reason: only the real loader and route show that the template is excluded and
// that a renamed copy builds, specs/014-project-four-part-story contracts/build-errors.md X01, X02).
// The file's text checks are in tests/unit/content/project-template.test.ts. It runs in the
// content-only tier (`test:build:content`) because it reads a real content file.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

describe("the project template (build)", () => {
  const template = "../../../src/content/projects/_template.mdx";

  // X01: the loader pattern `!**/_*` leaves the template out, so it gets no page, row or sitemap entry.
  it("X01: _template.mdx is excluded: no page, no sitemap entry", async () => {
    result = await buildFixtureSite([], { mode: "build", withoutRealProjects: true, projects: [] });
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
    expect(existsSync(join(result.dist, "projects/_template/index.html"))).toBe(false);
    expect(existsSync(join(result.dist, "projects/template/index.html"))).toBe(false);
    expect(result.read("sitemap-0.xml")).not.toContain("template");
  });

  // X02, SC-003: a renamed copy builds cleanly and its page has the four parts, the links and the invitation.
  it("X02: a renamed copy of the template builds with four parts, links and the invitation", async () => {
    result = await buildFixtureSite([], {
      mode: "build",
      withoutRealProjects: true,
      projects: [{ from: template, to: "my-new-project.mdx" }],
    });
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
    const html = result.read("projects/my-new-project/index.html");
    for (const heading of ["Problem", "Options", "Build", "Lessons"]) expect(html).toContain(heading);
    expect(html).toContain("https://example.com/source");
    expect(html).toContain("tell me about it");
  });
});
