// Unit tests (primary layer: unit) for the project collection schema of the four-part story
// (specs/014-project-four-part-story/data-model.md "Project", "PartPicture"; contracts/build-errors.md rows
// S01-S08, R01-R04, N01-N03). `image()` is Astro's schema helper; a plain string stands in for it here.
// The Options table is no longer settings data: it is checked by project-story.test.ts.
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { projectSchema } from "../../../src/content/schemas/project.ts";
import { partHeadings, partIds } from "../../../src/lib/content/parts.ts";

const schema = projectSchema({ image: () => z.string() });

const minimal = {
  title: "Focus Pocus",
  problem: "Managing OmniFocus meant switching apps.",
  description: "How Focus Pocus lets Claude manage OmniFocus.",
  themes: ["AI integration"],
  status: "experiment",
  date: "2025-06-01",
  visual: { kind: "image", src: "./images/fp/index.png", alt: "Claude answering a question" },
};

const full = {
  ...minimal,
  themes: ["AI integration", "Automation", "macOS"],
  demo: { href: "https://drc.dev/demo/fp", title: "Focus Pocus" },
  source: "https://github.com/drcdev/focus-pocus",
  image: { src: "./images/fp/share.png", alt: "Share image" },
  invitation: "Got a similar problem? Get in touch.",
  draft: true,
  visuals: {
    screenshot: { kind: "image", src: "./a.png", alt: "A screenshot", placeholder: true, part: "build" },
    architecture: { kind: "diagram", src: "./a.svg", alt: "A diagram", description: "Boxes and arrows.", part: "options" },
    spare: { kind: "image", src: "./b.png", alt: "Kept for reference" },
  },
};

const clip = { kind: "clip", src: "./w.webm", poster: "./w.png", label: "A walkthrough", description: "Shows the flow." };

const ok = (value: unknown) => expect(schema.safeParse(value).success).toBe(true);
const rejects = (value: unknown) => expect(schema.safeParse(value).success).toBe(false);
const omit = (value: object, key: string) => Object.fromEntries(Object.entries(value).filter(([k]) => k !== key));
const without = (key: string) => omit(minimal, key);
// The text Astro prints for a schema failure: one `path: message` line per issue.
const issueText = (value: unknown) => {
  const result = schema.safeParse(value);
  expect(result.success, "the schema should reject the value").toBe(false);
  return (result.error?.issues ?? []).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
};

describe("part ids", () => {
  it("lists the four parts in order with their headings", () => {
    expect(partIds).toEqual(["problem", "options", "build", "lessons"]);
    expect(partHeadings).toEqual({ problem: "Problem", options: "Options", build: "Build", lessons: "Lessons" });
  });
});

describe("projectSchema", () => {
  it("accepts a minimal project and defaults draft to false", () => {
    const result = schema.safeParse(minimal);
    expect(result.success).toBe(true);
    expect(result.data?.draft).toBe(false);
  });

  it("accepts a project with every setting", () => ok(full));

  it.each(["title", "problem", "description", "themes", "status", "visual", "date"])("S01 requires %s", (key) =>
    rejects(without(key)));

  it("rejects an unknown or wrongly typed setting", () => {
    rejects({ ...minimal, colour: "red" });
    rejects({ ...minimal, draft: "yes" });
    rejects({ ...minimal, title: "  " });
    rejects({ ...minimal, date: "not a date" });
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

  describe("demo", () => {
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
      rejects({ ...minimal, demo: { href: "https://drc.dev/x" }, standIn: { href: "https://example.com/" } });
    });
    it("requires alt on the sharing image", () => rejects({ ...minimal, image: { src: "./a.png", alt: "" } }));
  });

  describe("invitation (N03)", () => {
    it("is optional and trimmed", () => {
      ok(minimal);
      const result = schema.safeParse({ ...minimal, invitation: "  Talk to me.  " });
      expect(result.data?.invitation).toBe("Talk to me.");
    });
    it("treats empty text as the standard sentence (no value)", () => {
      for (const invitation of ["", "   "]) {
        const result = schema.safeParse({ ...minimal, invitation });
        expect(result.success).toBe(true);
        expect(result.data?.invitation).toBeUndefined();
      }
    });
    it("rejects a value that is not text", () => {
      rejects({ ...minimal, invitation: 5 });
      expect(issueText({ ...minimal, invitation: 5 })).toContain("invitation");
    });
  });

  describe("visuals", () => {
    const withVisuals = (visuals: unknown) => ({ ...minimal, visuals });
    it("requires alt on an image and description on a diagram", () => {
      rejects(withVisuals({ a: { kind: "image", src: "./a.png", alt: "" } }));
      rejects(withVisuals({ a: { kind: "diagram", src: "./a.svg", alt: "x" } }));
      rejects(withVisuals({ a: { kind: "diagram", src: "./a.svg", alt: "x", description: " " } }));
    });
    it("rejects an unknown kind", () => rejects(withVisuals({ a: { kind: "gif", src: "./a.gif", alt: "x" } })));
    it("checks the visual name pattern (S08)", () => {
      const image = { kind: "image", src: "./a.png", alt: "x" };
      ok(withVisuals({ "a-1": image }));
      rejects(withVisuals({ "1a": image }));
      rejects(withVisuals({ Screenshot: image }));
      rejects(withVisuals({ "a b": image }));
    });
    it("accepts a diagram as the list picture and rejects a part on it", () => {
      ok({ ...minimal, visual: { kind: "diagram", src: "./a.svg", alt: "x", description: "d" } });
      rejects({ ...minimal, visual: { ...minimal.visual, part: "build" } });
    });
    it("N01: accepts each part id and rejects another", () => {
      for (const part of partIds) ok(withVisuals({ a: { kind: "image", src: "./a.png", alt: "x", part } }));
      rejects(withVisuals({ a: { kind: "image", src: "./a.png", alt: "x", part: "outcome" } }));
    });
    it("N02: accepts one picture per part, and pictures without a part", () => {
      const image = (part?: string) => ({ kind: "image", src: "./a.png", alt: "x", ...(part ? { part } : {}) });
      ok(withVisuals({ a: image("problem"), b: image("options"), c: image(), d: image() }));
    });
  });
});

// One case per schema row of contracts/build-errors.md: the message carries the contract phrase.
describe("projectSchema messages (contracts/build-errors.md)", () => {
  it("S01: a missing title, problem, description or date names the setting", () => {
    for (const key of ["title", "problem", "description", "date"]) expect(issueText(without(key))).toContain(key);
  });
  it("S02: an unknown status names status and lists the allowed values", () => {
    const text = issueText({ ...minimal, status: "finished" });
    for (const phrase of ["status", "shipped", "experiment", "in-progress"]) expect(text).toContain(phrase);
  });
  it.each([
    ["none", []],
    ["more than four", ["a", "b", "c", "d", "e"]],
    ["a duplicate", ["AI integration", "ai   Integration"]],
  ])("S03: %s themes name themes", (_name, themes) => expect(issueText({ ...minimal, themes })).toContain("themes"));
  it("S04: a list picture without alt names visual and alt", () => {
    const text = issueText({ ...minimal, visual: { kind: "image", src: "./images/sample.png" } });
    expect(text).toContain("visual");
    expect(text).toContain("alt");
  });
  it("S04: a diagram without a description names visual and description", () => {
    const text = issueText({ ...minimal, visual: { kind: "diagram", src: "./a.svg", alt: "x" } });
    expect(text).toContain("visual");
    expect(text).toContain("description");
  });
  it("S05: a misspelled setting is named", () => expect(issueText({ ...minimal, titel: "Oops" })).toContain("titel"));
  it("S06: a long problem asks for one sentence of at most 140 characters", () => {
    const text = issueText({ ...minimal, problem: `${"word ".repeat(40)}end.` });
    expect(text).toContain("problem");
    expect(text).toContain("one sentence of at most 140 characters");
  });
  it("S07: a demo address off drc.dev names href and drc.dev", () => {
    const text = issueText({ ...minimal, demo: { href: "https://example.com/demo" } });
    expect(text).toContain("href");
    expect(text).toContain("drc.dev");
  });
  it.each([
    ["source", { source: "http://github.com/drcdev/thing" }],
    ["standIn.href", { standIn: { href: "http://example.com/x" } }],
  ])("S07: %s that is not https names the setting and https://", (key, extra) => {
    const text = issueText({ ...minimal, ...extra });
    expect(text).toContain(key);
    expect(text).toContain("https://");
  });
  it("S07: demo and standIn together say demo or standIn, not both", () =>
    expect(
      issueText({ ...minimal, demo: { href: "https://demo.drc.dev/x" }, standIn: { href: "https://example.com/x" } }),
    ).toContain("demo or standIn, not both"));
  it("S08: a bad picture name names visuals and the name", () => {
    const text = issueText({ ...minimal, visuals: { Bad_Name: { kind: "image", src: "./a.png", alt: "x" } } });
    expect(text).toContain("visuals");
    expect(text).toContain("Bad_Name");
  });

  it("R01: order names order", () => expect(issueText({ ...minimal, order: 1 })).toContain("order"));
  it("R02: demo.embed names embed", () =>
    expect(issueText({ ...minimal, demo: { href: "https://drc.dev/x", embed: true } })).toContain("embed"));
  it("R03: a clip picture names visuals and kind", () => {
    const text = issueText({ ...minimal, visuals: { walk: clip } });
    expect(text).toContain("visuals");
    expect(text).toContain("kind");
  });
  it("R04: comparison names comparison", () =>
    expect(issueText({ ...minimal, comparison: { constraints: [], options: [] } })).toContain("comparison"));

  it("N01: a bad part names part and lists the four parts", () => {
    const text = issueText({ ...minimal, visuals: { a: { kind: "image", src: "./a.png", alt: "x", part: "outcome" } } });
    for (const phrase of ["part", "problem", "options", "build", "lessons"]) expect(text).toContain(phrase);
  });
  it("N02: two pictures on one part name both pictures and the part", () => {
    const image = { kind: "image", src: "./a.png", alt: "x", part: "build" };
    const text = issueText({ ...minimal, visuals: { first: image, second: image } });
    for (const phrase of ["first", "second", "build"]) expect(text).toContain(phrase);
  });
  it("N03: an invitation that is not text names invitation", () =>
    expect(issueText({ ...minimal, invitation: 3 })).toContain("invitation"));
});
