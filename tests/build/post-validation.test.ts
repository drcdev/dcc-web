// One test per row of contracts/build-errors.md (P1 to P22): the real Astro build
// must reject each broken post file with a message that names the file and the
// problem (SC-003, FR-003, FR-018, FR-033, FR-043, FR-044, FR-052). Fixtures live
// in tests/fixtures/posts/broken/. The build stops at the first error, so each run
// has one broken file.
import { afterEach, describe, expect, it } from "vitest";
import { topicIds } from "../../src/config/topics.ts";
import { sectionNames } from "../../src/components/sections/index.ts";
import { buildFixtureSite, type FixtureFile, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

type Options = NonNullable<Parameters<typeof buildFixtureSite>[1]>;

async function expectRejected(
  posts: readonly (string | FixtureFile)[],
  contains: readonly string[],
  options: Options = {},
) {
  result = await buildFixtureSite([], { ...options, posts });
  expect(result.ok, "the build should fail").toBe(false);
  for (const text of contains) expect(result.message).toContain(text);
}

const broken = (name: string, to?: string): FixtureFile => ({ from: `broken/${name}`, ...(to ? { to } : {}) });

describe("build errors for post files (contracts/build-errors.md)", () => {
  it("P1: no title", () => expectRejected([broken("p01-no-title.mdx")], ["p01-no-title", "title"]));

  it("P2: no summary", () => expectRejected([broken("p02-no-summary.mdx")], ["p02-no-summary", "summary"]));

  it("P3: no date", () => expectRejected([broken("p03-no-date.mdx")], ["p03-no-date", "date"]));

  it.each([
    ["p04-date-words.mdx", "next tuesday"],
    ["p04-date-quoted.mdx", "quotes"],
    ["p04-date-slashes.mdx", "27/08/2026"],
    ["p04-date-impossible.mdx", "2026-02-30"],
  ])("P4: unreadable date (%s)", (name, found) =>
    expectRejected([broken(name)], [name.replace(/\.mdx$/, ""), "date", found]),
  );

  it.each(["p05-no-topics.mdx", "p05-empty-topics.mdx"])("P5: no topics (%s)", (name) =>
    expectRejected([broken(name)], [name.replace(/\.mdx$/, ""), "topics"]),
  );

  it("P6: unknown topic names every allowed topic in list order", async () => {
    await expectRejected([broken("p06-unknown-topic.mdx")], ["p06-unknown-topic", "agentic-a1"]);
    expect(result!.message).toContain(topicIds.join(", "));
  });

  it("P7: same topic twice", () => expectRejected([broken("p07-repeated-topic.mdx")], ["p07-repeated-topic", "topics"]));

  it("P8: feature image without alt text", () =>
    expectRejected([broken("p08-image-no-alt.mdx")], ["p08-image-no-alt", "alt", "alt text"]));

  it("P9: feature image file that does not exist", () =>
    expectRejected([broken("p09-image-missing.mdx")], ["Post file", "p09-image-missing", "./images/missing.png"]));

  it("P10: updated earlier than date", () =>
    expectRejected([broken("p10-updated-before-date.mdx")], ["p10-updated-before-date", "updated"]));

  it("P11: misspelled setting", () =>
    expectRejected([broken("p11-misspelled-setting.mdx")], ["p11-misspelled-setting", "sumary"]));

  it("P12: body image with empty alt text", () =>
    expectRejected([broken("p12-body-image-no-alt.mdx")], ["Post file", "p12-body-image-no-alt", "alt text"]));

  it("P13: a .md file", () =>
    expectRejected([broken("p13-markdown-file.md")], ["Post file", "p13-markdown-file.md", "rename it to .mdx"]));

  it("P14: a post in a sub-folder", () =>
    expectRejected(
      [broken("p14-sub-folder.mdx", "notes/p14-sub-folder.mdx")],
      ["Post file", "p14-sub-folder.mdx", "sub-folder"],
    ));

  it("P15: a file name with characters other than lower-case letters, digits and hyphens", () =>
    expectRejected(
      [broken("p15_bad_name.mdx")],
      ["Post file", "p15_bad_name.mdx", "lower-case letters, digits and hyphens"],
    ));

  it.each(["all", "topics"])("P16: reserved slug %s", (slug) =>
    expectRejected(
      [broken("p16-reserved-slug.mdx", `${slug}.mdx`)],
      ["Post file", `${slug}.mdx`, `/writing/${slug}/`, "reserved"],
    ),
  );

  it("P17: two files with one slug", () =>
    expectRejected(
      [broken("p17-duplicate.mdx"), broken("p17-duplicate.md")],
      ["Post files", "p17-duplicate.mdx", "p17-duplicate.md", "/writing/p17-duplicate/"],
    ));

  it("P18: level-1 heading in the body", () =>
    expectRejected([broken("p18-level-one-heading.mdx")], ["Post file", "p18-level-one-heading", "use ##"]));

  it("P19: unknown section tag", async () => {
    await expectRejected([broken("p19-unknown-section.mdx")], ["Post file", "p19-unknown-section", "Callout"]);
    for (const name of sectionNames) expect(result!.message).toContain(name);
  });

  it("P20: empty body", () =>
    expectRejected([broken("p20-empty-body.mdx")], ["Post file", "p20-empty-body", "no content"]));

  it("P21: a topic removed from the list while a post still names it", () =>
    expectRejected([broken("p21-removed-topic.mdx")], ["technology-teams"], {
      overrides: {
        "src/config/topics.ts": (text) =>
          text.replace(/\n  \{\n    id: "technology-teams",[\s\S]*?colour: "sage",\n  \},/, ""),
      },
    }));

  // Astro's own image import error names the post file and the image path (spike 3, research R1).
  it("P22: body image file that does not exist", () =>
    expectRejected([broken("p22-body-image-missing.mdx")], ["p22-body-image-missing", "./images/missing.png"]));
});

describe("things that are not errors", () => {
  it("builds a post whose code fence names an unknown language (shown as plain text)", async () => {
    result = await buildFixtureSite([], { posts: ["valid/unknown-language.mdx"] });
    expect(result.message).toBe("");
    expect(result.read("writing/unknown-language/index.html")).toContain("text in a language nobody has heard of");
  });
});
