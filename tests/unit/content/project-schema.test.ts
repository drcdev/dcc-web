// Unit tests for the project collection schema (data-model.md "Project",
// "Demo and StandIn", "Comparison", "IndexVisual / Visual"; FR-016, FR-042, FR-073).
// `image()` is Astro's schema helper; a plain string stands in for it here.
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { projectSchema } from "../../../src/content/schemas/project.ts";

const schema = projectSchema({ image: () => z.string() });

const comparison = {
  constraints: [
    { id: "macos-only", label: "Works on macOS", detail: "Runs on the Mac." },
    { id: "dates", label: "Natural-language dates" },
  ],
  options: [
    {
      id: "url-scheme",
      name: "URL scheme",
      summary: "Open links.",
      fit: { "macos-only": "meets", dates: "misses" },
      cons: ["Cannot read tasks back."],
    },
    {
      id: "jxa",
      name: "JXA",
      summary: "Script it.",
      fit: { "macos-only": "meets", dates: "partly" },
      chosen: true,
      reason: "It can read and change tasks.",
    },
  ],
};

const minimal = {
  title: "Focus Pocus",
  problem: "Managing OmniFocus meant switching apps.",
  description: "How Focus Pocus lets Claude manage OmniFocus.",
  themes: ["AI integration"],
  status: "experiment",
  visual: { kind: "image", src: "./images/fp/index.png", alt: "Claude answering a question" },
  comparison,
};

const full = {
  ...minimal,
  themes: ["AI integration", "Automation", "macOS"],
  order: 1,
  date: "2025-06-01",
  demo: { href: "https://drc.dev/demo/fp", title: "Focus Pocus", embed: true },
  source: "https://github.com/drcdev/focus-pocus",
  image: { src: "./images/fp/share.png", alt: "Share image" },
  draft: true,
  visuals: {
    screenshot: { kind: "image", src: "./a.png", alt: "A screenshot", placeholder: true },
    architecture: { kind: "diagram", src: "./a.svg", alt: "A diagram", description: "Boxes and arrows." },
    walkthrough: {
      kind: "clip",
      src: "./images/fp/walk.webm",
      poster: "./images/fp/walk.png",
      label: "A walkthrough",
      description: "Shows the flow.",
    },
  },
};

const ok = (value: unknown) => expect(schema.safeParse(value).success).toBe(true);
const rejects = (value: unknown) => expect(schema.safeParse(value).success).toBe(false);
const omit = (value: object, key: string) => Object.fromEntries(Object.entries(value).filter(([k]) => k !== key));
const without = (key: string) => omit(minimal, key);
// The text Astro prints for a schema failure: one `path: message` line per issue. The file name comes from
// Astro and is proven by the sync run in tests/build/project-validation.test.ts.
const issueText = (value: unknown) => {
  const result = schema.safeParse(value);
  expect(result.success, "the schema should reject the value").toBe(false);
  return (result.error?.issues ?? []).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
};

describe("projectSchema", () => {
  it("accepts a minimal project and defaults draft to false", () => {
    const result = schema.safeParse(minimal);
    expect(result.success).toBe(true);
    expect(result.data?.draft).toBe(false);
  });

  it("accepts a project with every setting", () => {
    ok(full);
  });

  it.each(["title", "problem", "description", "themes", "status", "visual", "comparison"])(
    "requires %s",
    (key) => rejects(without(key)),
  );

  it("rejects an unknown or wrongly typed setting", () => {
    rejects({ ...minimal, colour: "red" });
    rejects({ ...minimal, order: "1" });
    rejects({ ...minimal, draft: "yes" });
    rejects({ ...minimal, title: "  " });
    rejects({ ...minimal, visual: { ...minimal.visual, extra: 1 } });
  });

  it("accepts the three statuses only", () => {
    for (const status of ["shipped", "experiment", "in-progress"]) ok({ ...minimal, status });
    rejects({ ...minimal, status: "done" });
  });

  describe("problem", () => {
    it.each(["What?", "Stop!", "One sentence."])("accepts %s", (problem) => ok({ ...minimal, problem }));
    it.each([
      ["no end mark", "Managing OmniFocus meant switching apps"],
      ["two sentences", "First one. Second one."],
      ["empty", ""],
      ["over 140 characters", `${"a".repeat(140)}.`],
    ])("rejects %s", (_name, problem) => rejects({ ...minimal, problem }));
    it("accepts exactly 140 characters", () => ok({ ...minimal, problem: `${"a".repeat(139)}.` }));
  });

  describe("themes", () => {
    it("takes 1 to 4 themes", () => {
      rejects({ ...minimal, themes: [] });
      ok({ ...minimal, themes: ["a", "b", "c", "d"] });
      rejects({ ...minimal, themes: ["a", "b", "c", "d", "e"] });
    });
    it("rejects empty and duplicate themes after normalising", () => {
      rejects({ ...minimal, themes: [" "] });
      rejects({ ...minimal, themes: ["AI integration", "ai   Integration"] });
    });
  });

  describe("demo (FR-042)", () => {
    const demo = (href: string) => ({ ...minimal, demo: { href } });
    it.each(["https://drc.dev/x", "https://drc.dev", "https://x.drc.dev/y", "https://a.b.drc.dev/"])(
      "accepts %s",
      (href) => ok(demo(href)),
    );
    it.each([
      "http://drc.dev/x",
      "https://drc.dev.example.com/",
      "https://evildrc.dev/",
      "https://drc.dev@example.com/",
      "https://drc.dev:8443/",
      "https://user:pw@drc.dev/",
      "https://example.com/",
    ])("rejects %s", (href) => rejects(demo(href)));
    it("rejects unknown demo settings", () => rejects({ ...minimal, demo: { href: "https://drc.dev/", x: 1 } }));
  });

  describe("standIn, source and image", () => {
    it("accepts an https stand-in and rejects others", () => {
      ok({ ...minimal, standIn: { href: "https://example.com/page", label: "Page" } });
      rejects({ ...minimal, standIn: { href: "http://example.com/page" } });
    });
    it("rejects source that is not https", () => {
      rejects({ ...minimal, source: "http://github.com/x" });
      rejects({ ...minimal, source: "github.com/x" });
    });
    it("rejects demo and standIn together", () => {
      rejects({
        ...minimal,
        demo: { href: "https://drc.dev/x" },
        standIn: { href: "https://example.com/" },
      });
    });
    it("requires alt on the sharing image", () => {
      rejects({ ...minimal, image: { src: "./a.png", alt: "" } });
    });
  });

  describe("order (FR-016)", () => {
    it.each([1, 2, 10])("accepts %s", (order) => ok({ ...minimal, order }));
    it.each([0, -1, 1.5])("rejects %s", (order) => rejects({ ...minimal, order }));
  });

  describe("comparison", () => {
    const withComparison = (c: unknown) => ({ ...minimal, comparison: c });
    const option = (over: Record<string, unknown>) => ({
      id: "x",
      name: "X",
      summary: "s",
      fit: { "macos-only": "meets", dates: "meets" },
      ...over,
    });
    it("needs at least one option and one constraint", () => {
      rejects(withComparison({ ...comparison, options: [] }));
      rejects(withComparison({ ...comparison, constraints: [] }));
    });
    it("accepts a caption", () => ok(withComparison({ ...comparison, caption: "Options" })));
    it("needs exactly one chosen option", () => {
      rejects(withComparison({ ...comparison, options: [option({ id: "a" })] }));
      rejects(
        withComparison({
          ...comparison,
          options: [option({ id: "a", chosen: true, reason: "r" }), option({ id: "b", chosen: true, reason: "r" })],
        }),
      );
    });
    it("needs a reason on the chosen option and none on others", () => {
      rejects(withComparison({ ...comparison, options: [option({ id: "a", chosen: true })] }));
      rejects(
        withComparison({
          ...comparison,
          options: [option({ id: "a", chosen: true, reason: "r" }), option({ id: "b", reason: "no" })],
        }),
      );
    });
    it("needs unique option and constraint ids", () => {
      rejects(
        withComparison({
          ...comparison,
          options: [option({ id: "a", chosen: true, reason: "r" }), option({ id: "a" })],
        }),
      );
      rejects(
        withComparison({
          ...comparison,
          constraints: [
            { id: "macos-only", label: "A" },
            { id: "macos-only", label: "B" },
          ],
          options: [option({ id: "a", chosen: true, reason: "r", fit: { "macos-only": "meets" } })],
        }),
      );
    });
    it("needs a fit for every constraint and no extra fit ids", () => {
      rejects(
        withComparison({
          ...comparison,
          options: [option({ id: "a", chosen: true, reason: "r", fit: { "macos-only": "meets" } })],
        }),
      );
      rejects(
        withComparison({
          ...comparison,
          options: [
            option({ id: "a", chosen: true, reason: "r", fit: { "macos-only": "meets", dates: "meets", other: "meets" } }),
          ],
        }),
      );
    });
    it("rejects an unknown fit value and a bad id", () => {
      rejects(
        withComparison({
          ...comparison,
          options: [option({ id: "a", chosen: true, reason: "r", fit: { "macos-only": "yes", dates: "meets" } })],
        }),
      );
      rejects(withComparison({ ...comparison, constraints: [{ id: "Bad Id", label: "A" }] }));
    });
  });

  describe("visuals", () => {
    const withVisuals = (visuals: unknown) => ({ ...minimal, visuals });
    it("requires alt on an image and description on a diagram", () => {
      rejects(withVisuals({ a: { kind: "image", src: "./a.png", alt: "" } }));
      rejects(withVisuals({ a: { kind: "diagram", src: "./a.svg", alt: "x" } }));
      rejects(withVisuals({ a: { kind: "diagram", src: "./a.svg", alt: "x", description: " " } }));
    });
    it("requires every clip field and a .webm or .mp4 source", () => {
      const clip = full.visuals.walkthrough;
      ok(withVisuals({ a: { ...clip, src: "./a.mp4" } }));
      rejects(withVisuals({ a: { ...clip, src: "./a.gif" } }));
      for (const key of ["poster", "label", "description"]) {
        rejects(withVisuals({ a: omit(clip, key) }));
      }
    });
    it("rejects an unknown kind", () => rejects(withVisuals({ a: { kind: "gif", src: "./a.gif", alt: "x" } })));
    it("checks the visual name pattern", () => {
      const image = { kind: "image", src: "./a.png", alt: "x" };
      ok(withVisuals({ "a-1": image }));
      rejects(withVisuals({ "1a": image }));
      rejects(withVisuals({ Screenshot: image }));
      rejects(withVisuals({ "a b": image }));
    });
    it("reserves the name demo (FR-073)", () => {
      rejects(withVisuals({ demo: { kind: "image", src: "./a.png", alt: "x" } }));
    });
    it("does not allow a clip as the index visual", () => {
      rejects({ ...minimal, visual: full.visuals.walkthrough });
    });
    it("accepts a diagram as the index visual", () => {
      ok({ ...minimal, visual: { kind: "diagram", src: "./a.svg", alt: "x", description: "d" } });
    });
  });
});

// One case per schema row of contracts/build-errors.md (009): the message carries the contract phrase.
// The inputs are the ones the deleted broken fixtures used.
describe("projectSchema messages (contracts/build-errors.md)", () => {
  const one = { ...comparison.options[1], fit: { "macos-only": "meets", dates: "meets" } };
  const withComparison = (c: unknown) => ({ ...minimal, comparison: c });
  const goodOption = (over: Record<string, unknown>) => ({
    id: "a",
    name: "A",
    summary: "s",
    fit: { "macos-only": "meets", dates: "meets" },
    ...over,
  });

  it("row 01: a missing title names title", () => expect(issueText(without("title"))).toContain("title"));
  it("row 02: a missing problem names problem", () => expect(issueText(without("problem"))).toContain("problem"));
  it("row 03: an unknown status names status and lists the allowed values", () => {
    const text = issueText({ ...minimal, status: "finished" });
    for (const phrase of ["status", "shipped", "experiment", "in-progress"]) expect(text).toContain(phrase);
  });
  it.each([
    ["none", []],
    ["more than four", ["a", "b", "c", "d", "e"]],
    ["a duplicate", ["AI integration", "ai   Integration"]],
  ])("row 04: %s themes name themes", (_name, themes) => expect(issueText({ ...minimal, themes })).toContain("themes"));
  it("row 05: an index visual without alt names visual and alt", () => {
    const text = issueText({ ...minimal, visual: { kind: "image", src: "./images/sample.png" } });
    expect(text).toContain("visual");
    expect(text).toContain("alt");
  });
  it.each(["first", 0, -1, 1.5])("row 06: order %s names order", (order) =>
    expect(issueText({ ...minimal, order })).toContain("order"));
  it("row 07: a misspelled setting is named", () => expect(issueText({ ...minimal, titel: "Oops" })).toContain("titel"));
  it("row 08: a long problem asks for one sentence of at most 140 characters", () => {
    const text = issueText({ ...minimal, problem: `${"word ".repeat(40)}end.` });
    expect(text).toContain("problem");
    expect(text).toContain("one sentence of at most 140 characters");
  });
  it("row 12: no chosen option says exactly one option must be chosen", () =>
    expect(issueText(withComparison({ ...comparison, options: [goodOption({})] }))).toContain(
      "exactly one option must be chosen",
    ));
  it("row 13: a chosen option without a reason names reason", () =>
    expect(issueText(withComparison({ ...comparison, options: [goodOption({ chosen: true })] }))).toContain("reason"));
  it("row 14: an option missing a fit names the option and the constraint", () => {
    const text = issueText(
      withComparison({
        ...comparison,
        options: [goodOption({ id: "script", chosen: true, reason: "r", fit: { "macos-only": "meets" } })],
      }),
    );
    expect(text).toContain("script");
    expect(text).toContain("dates");
  });
  it.each([
    ["no options", { ...comparison, options: [] }],
    ["no constraints", { ...comparison, constraints: [] }],
  ])("row 15: a comparison with %s names comparison", (_name, c) =>
    expect(issueText(withComparison(c))).toContain("comparison"));
  it("row 18: a diagram without a description names alt or description", () => {
    const text = issueText({ ...minimal, visual: { kind: "diagram", src: "./a.svg", alt: "x" } });
    expect(text).toContain("visual");
    expect(text).toContain("description");
  });
  it("row 19: a clip without a description names description", () => {
    const clip = omit(full.visuals.walkthrough, "description");
    expect(issueText({ ...minimal, visuals: { walk: clip } })).toContain("description");
  });
  it("row 20: a demo address off drc.dev names href and drc.dev", () => {
    const text = issueText({ ...minimal, demo: { href: "https://example.com/demo" } });
    expect(text).toContain("href");
    expect(text).toContain("drc.dev");
  });
  it.each([
    ["source", { source: "http://github.com/drcdev/thing" }],
    ["standIn.href", { standIn: { href: "http://example.com/x" } }],
  ])("row 21: %s that is not https names the setting and https://", (key, extra) => {
    const text = issueText({ ...minimal, ...extra });
    expect(text).toContain(key);
    expect(text).toContain("https://");
  });
  it("row 22: demo and standIn together say demo or standIn, not both", () =>
    expect(
      issueText({ ...minimal, demo: { href: "https://demo.drc.dev/x" }, standIn: { href: "https://example.com/x" } }),
    ).toContain("demo or standIn, not both"));
  it("row 31: a fit naming an unknown constraint names comparison and the id", () => {
    const text = issueText(
      withComparison({
        ...comparison,
        options: [{ ...one, chosen: true, reason: "r", fit: { "macos-only": "meets", dates: "meets", ghost: "meets" } }],
      }),
    );
    expect(text).toContain("comparison");
    expect(text).toContain("ghost");
  });
  it("row 31: a reason on an unchosen option names comparison and the option id", () => {
    const text = issueText(
      withComparison({
        ...comparison,
        options: [goodOption({ id: "a", chosen: true, reason: "r" }), goodOption({ id: "b", reason: "no" })],
      }),
    );
    expect(text).toContain("comparison");
    expect(text).toContain("b");
  });
  it("row 31: a duplicate id names comparison and the id", () => {
    const text = issueText(
      withComparison({
        ...comparison,
        options: [goodOption({ id: "dup", chosen: true, reason: "r" }), goodOption({ id: "dup" })],
      }),
    );
    expect(text).toContain("comparison");
    expect(text).toContain("dup");
  });
  it.each([
    ["a bad shape", "Bad_Name"],
    ["the reserved name demo", "demo"],
  ])("row 32: a visual name with %s names visuals and the name", (_name, key) => {
    const text = issueText({ ...minimal, visuals: { [key]: { kind: "image", src: "./a.png", alt: "x" } } });
    expect(text).toContain("visuals");
    expect(text).toContain(key);
  });
  it("row 32: a clip as the index visual names visual", () =>
    expect(issueText({ ...minimal, visual: full.visuals.walkthrough })).toContain("visual"));
});
