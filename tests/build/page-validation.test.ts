// Wiring runs for the page rows of contracts/build-errors.md (SC-003, FR-007 to FR-009). The logic of
// each row is asserted in a unit test (see docs/testing.md and the coverage table in the chore plan);
// these runs prove that Astro runs that logic on real files and that the message reaches the output
// with the file name. `sync` covers the call sites in src/content.config.ts (the collection schema
// and the glob loader's generateId); `build` covers the page route, the section components and
// errors raised by Astro itself. Each run holds exactly one broken file, because a build stops at the
// first error. Fixtures live in tests/fixtures/pages/broken/.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureFile, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

async function expectRejected(
  mode: "sync" | "build",
  files: readonly (string | FixtureFile)[],
  ...contains: string[]
) {
  result = await buildFixtureSite(files, { mode });
  expect(result.ok, `the ${mode} should fail`).toBe(false);
  for (const text of contains) expect(result.message).toContain(text);
}

const broken = (name: string, to?: string): FixtureFile => ({ from: `broken/${name}`, to });

describe("page schema and loader wiring (sync)", () => {
  it("rows 1 to 5: the pages schema is wired and Astro names the file", () =>
    expectRejected("sync", [broken("01-no-title.mdx")], "01-no-title", "title"));

  it("row 6: generateId runs assertImagesExist", () =>
    expectRejected(
      "sync",
      [broken("06-missing-image-frontmatter.mdx")],
      "Page file",
      "06-missing-image-frontmatter",
      "does-not-exist.png",
    ));

  it("row 17: generateId runs idFromPath", () =>
    expectRejected(
      "sync",
      [broken("17-bad-file-name.mdx", "About_Me.mdx")],
      "About_Me.mdx",
      "lower-case letters, digits and hyphens",
    ));

  // The twin check runs in generateId, so it fires at sync with the custom wording, ahead of Astro's own
  // duplicate-slug error (prerenderConflictBehavior: 'error').
  it("row 13: generateId runs the twin check (x.mdx and x/index.mdx)", () =>
    expectRejected(
      "sync",
      [broken("13-duplicate-address-a.mdx", "x.mdx"), broken("13-duplicate-address-b.mdx", "x/index.mdx")],
      "x.mdx",
      "x/index.mdx",
      "/x/",
      "both make the address /x/. Keep one of them.",
    ));
});

describe("page route and component wiring (build)", () => {
  it("row 7: Astro rejects a body image that does not exist", () =>
    expectRejected("build", [broken("07-missing-image-body.mdx")], "does-not-exist.png"));

  it("row 14: the route checks addresses over the src/pages route-file list (404.mdx against 404.astro)", () =>
    expectRejected("build", [broken("14-route-conflict.mdx", "404.mdx")], "404.mdx", "404.astro", "/404/"));

  // Second layer: the unit test sees only the configured value; only a real build shows that Astro
  // raises its own error. The custom route check is bypassed here, so this proves the backstop.
  it("Astro's prerenderConflictBehavior: 'error' fails a page that clashes with a code route (custom check bypassed)", async () => {
    const route = "src/pages/[...slug].astro";
    const needle = "assertPageAddressesFree({ pageFiles, routeFiles";
    let patched = false;
    result = await buildFixtureSite([broken("14-route-conflict.mdx", "404.mdx")], {
      mode: "build",
      overrides: {
        [route]: (text) => {
          const next = text.replace(needle, "assertPageAddressesFree({ pageFiles, routeFiles: []");
          patched = next !== text;
          return next;
        },
      },
    });
    expect(patched, "the route override should have matched").toBe(true);
    expect(result.ok, "the build should fail").toBe(false);
    expect(result.message).toContain("conflicts with higher priority route");
    expect(result.message).toContain("`/404`");
  });

  it("rows 8 to 10 and 16: the route runs validatePageBody", () =>
    expectRejected("build", [broken("16-level-one-heading.mdx")], "Page file", "16-level-one-heading", "use ##"));

  it("rows 11 and 12: a section check names the section and the page file", () =>
    expectRejected("build", [broken("11-section-missing-prop.mdx")], "11-section-missing-prop", "CallToAction", "href"));
});
