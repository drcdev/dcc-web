// Wiring runs for the post rows of contracts/build-errors.md (SC-003, FR-003, FR-012a, FR-018, FR-033,
// FR-043, FR-044, FR-052). The logic of each row is asserted in a unit test (see docs/testing.md and
// the coverage table in the chore plan); these runs prove that Astro runs that logic on real files and
// that the message reaches the output with the file name. `sync` covers the call sites in
// src/content.config.ts (the collection schema and the glob loader's generateId); `build` covers the
// posts route, `getCheckedPosts` and errors raised by Astro itself. Each run holds exactly one broken
// file, because a build stops at the first error. Fixtures live in tests/fixtures/posts/broken/.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureFile, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

async function expectRejected(
  mode: "sync" | "build",
  posts: readonly (string | FixtureFile)[],
  ...contains: string[]
) {
  result = await buildFixtureSite([], { mode, posts });
  expect(result.ok, `the ${mode} should fail`).toBe(false);
  for (const text of contains) expect(result.message).toContain(text);
}

const broken = (name: string, to?: string): FixtureFile => ({ from: `broken/${name}`, ...(to ? { to } : {}) });

describe("post schema and loader wiring (sync)", () => {
  // Also covers rows P1 to P3, P5 to P8, P10, P11, P23, P24 and P26 (the schema is wired and Astro names the file).
  it("validates drafts too: the posts schema is wired and Astro names the file (P23, FR-012a)", () =>
    expectRejected(
      "sync",
      [{ from: "broken/p23-both-series.mdx", to: "draft-both.mdx", replace: ["topics:", "draft: true\ntopics:"] }],
      "draft-both",
      "one series",
    ));

  it("P4: generateId runs assertPostDates", () =>
    expectRejected("sync", [broken("p04-date-impossible.mdx")], "p04-date-impossible", "date", "2026-02-30"));

  it("P9: generateId runs assertImagesExist with the post wording", () =>
    expectRejected("sync", [broken("p09-image-missing.mdx")], "Post file", "p09-image-missing", "./images/missing.png"));

  it("P17: generateId runs the twin check", () =>
    expectRejected(
      "sync",
      [
        { from: "valid/minimal.mdx", to: "x.mdx" },
        { from: "valid/long-title.mdx", to: "x.md" },
      ],
      "Post files",
      "x.md",
      "x.mdx",
      "/writing/x/",
    ));

  // Changed by 013 (research R9): ids outside the controlled list are free-form topics. Rendering a
  // free-form topic page is proven by the blog-listing build, so this run only needs validation to accept it.
  it("P21 (changed): a removed controlled topic id is accepted as a free-form topic", async () => {
    result = await buildFixtureSite([], {
      mode: "sync",
      posts: [broken("p21-removed-topic.mdx")],
      overrides: {
        "src/config/topics.ts": (text) =>
          text.replace(/\n  \{\n    id: "technology-teams",[\s\S]*?colour: "sand",\n  \},/, ""),
      },
    });
    expect(result.ok, result.message).toBe(true);
  });
});

describe("post route and Astro wiring (build)", () => {
  // Astro's own image import error names the post file and the image path (spike 3, research R1).
  it("P22: Astro rejects a body image that does not exist", () =>
    expectRejected("build", [broken("p22-body-image-missing.mdx")], "p22-body-image-missing", "./images/missing.png"));

  it("P13: getCheckedPosts runs assertPostFiles", () =>
    expectRejected("build", [broken("p13-markdown-file.md")], "Post file", "p13-markdown-file.md", "rename it to .mdx"));

  it("P20: getCheckedPosts runs validatePageBody with the post wording", () =>
    expectRejected("build", [broken("p20-empty-body.mdx")], "Post file", "p20-empty-body", "no content"));
});
