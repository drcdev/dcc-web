// The question source files and the panel in a real build (specs/022 tasks T022; data-model
// section 1; contracts/questions-panel.md P01, P02, P06). Two builds, both with a published and a
// draft post: production (Workers Builds, main) and preview (another branch).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAX_INPUT_CHARS } from "../../worker/src/questions/config.ts";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";
import { filesUnder } from "../helpers/files.ts";

const builds: Record<"production" | "preview", FixtureSiteResult> = {} as never;

beforeAll(async () => {
  const options = { posts: ["valid/published.mdx", "valid/draft.mdx"] };
  builds.production = await buildFixtureSite([], { ...options, env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" } });
  builds.preview = await buildFixtureSite([], { ...options, env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "some-branch" } });
}, 900_000);

afterAll(() => {
  for (const build of Object.values(builds)) build.cleanup();
});

interface Source {
  slug: string;
  title: string;
  summary: string;
  text: string;
  hash: string;
}
const source = (build: FixtureSiteResult, slug: string) =>
  JSON.parse(build.read(`writing/${slug}/question-source.json`)) as Source;
const has = (build: FixtureSiteResult, path: string) => existsSync(join(build.dist, path));

describe("question-source.json", () => {
  it("is written for a published post with the fields of data-model section 1", () => {
    const file = source(builds.production, "published");
    expect(Object.keys(file).sort()).toEqual(["hash", "slug", "summary", "text", "title"]);
    expect(file.slug).toBe("published");
    expect(file.title.length).toBeGreaterThan(0);
    expect(file.summary.length).toBeGreaterThan(0);
    expect(file.text.length).toBeGreaterThan(0);
    expect(file.text.length).toBeLessThanOrEqual(MAX_INPUT_CHARS);
    expect(file.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is not written for a draft in a production build, and is in a preview build", () => {
    expect(has(builds.production, "writing/draft/question-source.json")).toBe(false);
    expect(has(builds.preview, "writing/draft/question-source.json")).toBe(true);
  });

  it("holds the same hash as the data-hash on that post's page (P02)", () => {
    for (const build of Object.values(builds)) {
      const html = build.read("writing/published/index.html");
      expect(html).toContain(`data-hash="${source(build, "published").hash}"`);
      expect(html).toContain('data-slug="published"');
    }
  });

  it("is not in the sitemap output", () => {
    for (const build of Object.values(builds)) {
      for (const path of filesUnder(build.dist).filter((file) => /sitemap.*\.xml$/.test(file))) {
        expect(readFileSync(path, "utf-8")).not.toContain("question-source");
      }
    }
  });
});

describe("the panel in the built pages (P01, P06)", () => {
  it("is on a post page, once", () => {
    const html = builds.production.read("writing/published/index.html");
    expect(html.match(/<aside[^>]*data-questions[\s>]/g)).toHaveLength(1);
  });

  it("is not on a page that is not a post", () => {
    for (const path of ["writing/index.html", "index.html"]) {
      const html = builds.production.read(path);
      expect(html).not.toContain("data-questions");
      expect(html).not.toContain("/api/questions");
    }
  });

  it("ships the panel script on post pages only", () => {
    const scriptsOf = (html: string) =>
      [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((match) => match[1]!);
    const bundlesPanel = (html: string) =>
      scriptsOf(html).some((src) => /^\/_astro\//.test(src) && readFileSync(join(builds.production.dist, src), "utf-8").includes("/api/questions")) ||
      html.includes("/api/questions");
    expect(bundlesPanel(builds.production.read("writing/published/index.html"))).toBe(true);
    expect(bundlesPanel(builds.production.read("writing/index.html"))).toBe(false);
  });
});
