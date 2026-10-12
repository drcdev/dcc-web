// The assessment's loader script and title-card line reach only the posts that render it
// (contracts/assessment-ui.md U16; FR-017, SC-005). Only the real build shows what each built page
// references, across pages, so this is a build test.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let build: FixtureSiteResult;

beforeAll(async () => {
  build = await buildFixtureSite([], {
    posts: ["valid/published.mdx", "valid/with-assessment-block.mdx"],
    assessments: ["valid/sample.yaml"],
  });
  expect(build.ok, build.message).toBe(true);
}, 900_000);

afterAll(() => build?.cleanup());

const MARKER = "data-assessment";

/** The same-origin files a built page loads as scripts or stylesheets, as paths under dist. */
function assets(html: string): string[] {
  const urls = [...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="(\/_astro\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]!);
  return [...new Set(urls)];
}
const read = (url: string) => readFileSync(join(build.dist, url), "utf-8");

describe("assessment assets", () => {
  it("are referenced by the post that renders the block, with its title-card line", () => {
    const html = build.read("writing/with-assessment-block/index.html");
    expect(html).toContain(`${MARKER}-link`);
    expect(html).toContain(`${MARKER}-form`);
    const loader = assets(html).filter((url) => url.endsWith(".js")).some((url) => read(url).includes(MARKER));
    expect(loader, "a script of this page carries the assessment loader").toBe(true);
  });

  it("are absent from every other page", () => {
    for (const [path, html] of build.htmlFiles()) {
      if (path === "writing/with-assessment-block/index.html") continue;
      expect(html, path).not.toContain(MARKER);
      for (const url of assets(html)) expect(read(url), `${path} loads ${url}`).not.toContain(`[${MARKER}`);
    }
  });
});
