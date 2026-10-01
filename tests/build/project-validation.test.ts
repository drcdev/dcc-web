// Wiring runs for the project rows of contracts/build-errors.md (FR-073, FR-076, SC-006). The logic of each
// row is asserted in a unit test (project-schema, project-body, project-clips, project-address; see
// docs/testing.md and the coverage table in the chore plan). These runs prove that Astro runs that logic on
// real files, that the message names the file, and that it never carries an environment value. `sync`
// covers the call sites in src/content.config.ts (the collection schema and the glob loader's generateId);
// `build` covers the project story route. Each run holds exactly one broken file, because a build stops at
// the first error. Fixtures live in tests/fixtures/projects/broken/.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureFile, type FixtureSiteResult } from "./fixture-site.ts";

// A value that must never appear in any message.
const CANARY = "canary-secret-value-7f3a91";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

async function expectRejected(
  mode: "sync" | "build",
  projects: readonly (string | FixtureFile)[],
  contains: string[],
  env: Record<string, string> = {},
) {
  result = await buildFixtureSite([], { mode, projects, env: { PROJECT_VALIDATION_CANARY: CANARY, ...env } });
  expect(result.ok, `the ${mode} should fail`).toBe(false);
  for (const text of contains) expect(result.message).toContain(text);
  expect(result.message).not.toContain(CANARY);
}

const broken = (name: string, to?: string): FixtureFile => ({ from: `broken/${name}.mdx`, to: to ?? `${name}.mdx` });
const production = { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" };

describe("project schema and loader wiring (sync)", () => {
  // Also covers rows 01 to 08, 12 to 15, 18 to 22, 31 and 32 (the schema is wired and Astro names the file).
  it("validates drafts too: the projects schema is wired and Astro names the file (row 03, FR-073)", () =>
    expectRejected(
      "sync",
      [{ from: "draft.mdx", replace: ["status: in-progress", "status: nonsense"] }],
      ["draft", "status", "shipped", "experiment", "in-progress"],
      production,
    ));

  it("row 17: generateId runs assertProjectImagesExist (and the clip check of row 19)", () =>
    expectRejected("sync", [broken("17-missing-image")], ["17-missing-image", "./images/nope.png"]));

  it("row 27: generateId runs slugFromPath (and rejects a nested file the same way)", () =>
    expectRejected("sync", [broken("27-bad-file-name", "Bad Name.mdx")], [
      "Bad Name.mdx",
      "lower-case letters, digits and hyphens",
    ]));
});

describe("project route wiring (build)", () => {
  it("row 26: the route runs assertUniqueProjectFiles", () =>
    expectRejected(
      "build",
      [broken("26-duplicate-slug", "x.mdx"), broken("26-duplicate-slug", "x.md")],
      ["x.md", "x.mdx", "slug x"],
    ));

  // Rows 09 to 11 call site: validateProjectBody runs on drafts before the production filter (FR-073).
  it("rows 09 to 11: the route runs validateProjectBody on a draft in a production build", () =>
    expectRejected(
      "build",
      [{ from: "draft.mdx", replace: ['<Chapter stage="lessons">', '<Chapter stage="bogus">'] }],
      ["draft", "stage"],
      production,
    ));
});
