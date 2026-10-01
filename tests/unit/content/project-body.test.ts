// Unit tests for the project body check (contracts/build-errors.md rows 9, 10, 11,
// 16, 23 to 25, 28 to 30; FR-073).
import { describe, expect, it } from "vitest";
import { storyBlockNames } from "../../../src/components/project/blocks/index.ts";
import { validateProjectBody } from "../../../src/lib/content/project-body.ts";
import { stageIds } from "../../../src/lib/content/stages.ts";

const FILE = "src/content/projects/example.mdx";

interface Settings {
  visuals?: string[];
  embed?: boolean;
  demoLinks?: boolean;
}
const check = (body: string, settings: Settings = {}) =>
  validateProjectBody(FILE, body, {
    visualNames: settings.visuals ?? ["screenshot"],
    demoEmbed: settings.embed ?? false,
    hasDemoLinks: settings.demoLinks ?? false,
  });

const extras: Record<string, string> = {
  options: "<OptionComparison />",
  invitation: "<Invitation />",
};
const chapter = (stage: string, inner?: string, attrs = "") =>
  `<Chapter stage="${stage}"${attrs}>\n\n${inner ?? extras[stage] ?? "Text."}\n\n</Chapter>`;
const valid = (transform?: (stage: string) => string | undefined) =>
  stageIds.map((s) => (transform ? transform(s) : undefined) ?? chapter(s)).join("\n\n");

describe("validateProjectBody", () => {
  it("accepts the seven chapters in order", () => {
    expect(() => check(valid())).not.toThrow();
  });

  it("rejects a missing chapter, naming the file and the stage", () => {
    const body = stageIds.filter((s) => s !== "lessons").map((s) => chapter(s)).join("\n\n");
    expect(() => check(body)).toThrow(FILE);
    expect(() => check(body)).toThrow("is missing the chapter");
    expect(() => check(body)).toThrow("lessons");
  });

  it("rejects a repeated chapter", () => {
    const body = valid() + "\n\n" + chapter("outcome");
    expect(() => check(body)).toThrow("more than once");
    expect(() => check(body)).toThrow("outcome");
  });

  it("rejects chapters out of order", () => {
    const order = [...stageIds];
    [order[3], order[4]] = [order[4]!, order[3]!];
    const body = order.map((s) => chapter(s)).join("\n\n");
    expect(() => check(body)).toThrow("out of order");
    expect(() => check(body)).toThrow(FILE);
  });

  it("rejects an unknown block, listing the blocks", () => {
    const run = () => check(valid((s) => (s === "problem" ? chapter(s, "<Timeline />") : undefined)));
    expect(run).toThrow("<Timeline>");
    for (const name of storyBlockNames) expect(run).toThrow(name);
  });

  it("accepts a page section used inside a chapter", () => {
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, "<Lead>Hi</Lead>") : undefined)))).not.toThrow();
  });

  it("rejects an unknown visual name in Chapter and Visual", () => {
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, undefined, ' visual="nope"') : undefined)))).toThrow("nope");
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, '<Visual name="nope" />') : undefined)))).toThrow("nope");
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, undefined, ' visual="screenshot"') : undefined)))).not.toThrow();
  });

  it('rejects visual="demo" without demo.embed', () => {
    const body = valid((s) => (s === "built" ? chapter(s, "<Demo />", ' visual="demo"') : undefined));
    expect(() => check(body, { demoLinks: true })).toThrow("embed");
    expect(() => check(body, { demoLinks: true, embed: true })).not.toThrow();
  });

  it("requires OptionComparison once, only in the options chapter", () => {
    expect(() => check(valid((s) => (s === "options" ? chapter(s, "Text.") : undefined)))).toThrow("OptionComparison");
    expect(() => check(valid((s) => (s === "options" ? chapter(s, "<OptionComparison />\n\n<OptionComparison />") : undefined)))).toThrow("OptionComparison");
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, "<OptionComparison />") : undefined)))).toThrow("OptionComparison");
  });

  it("requires Invitation once, only in the invitation chapter", () => {
    expect(() => check(valid((s) => (s === "invitation" ? chapter(s, "Text.") : undefined)))).toThrow("Invitation");
    expect(() => check(valid((s) => (s === "invitation" ? chapter(s, "<Invitation />\n\n<Invitation />") : undefined)))).toThrow("Invitation");
    expect(() => check(valid((s) => (s === "outcome" ? chapter(s, "<Invitation />") : undefined)))).toThrow("Invitation");
  });

  it("allows Demo at most once, only in built, and requires it when demo links are set", () => {
    const built = (inner: string) => valid((s) => (s === "built" ? chapter(s, inner) : undefined));
    expect(() => check(built("<Demo />"), { demoLinks: true })).not.toThrow();
    expect(() => check(built("Text."), { demoLinks: true })).toThrow("Demo");
    expect(() => check(built("<Demo />\n\n<Demo />"), { demoLinks: true })).toThrow("Demo");
    expect(() => check(built("<Demo />"), { demoLinks: false })).not.toThrow();
    expect(() => check(valid((s) => (s === "outcome" ? chapter(s, "<Demo />") : undefined)))).toThrow("Demo");
  });

  it("rejects level-1 and level-2 headings", () => {
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, "# Title") : undefined)))).toThrow("use ### for headings");
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, "## Sub") : undefined)))).toThrow("use ### for headings");
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, "### Sub") : undefined)))).not.toThrow();
  });

  it("rejects a body image without alt text", () => {
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, "![](./a.png)") : undefined)))).toThrow("alt text");
  });

  it("ignores code fences and inline code", () => {
    const fenced = "```\n# Heading\n<Timeline />\n![](x.png)\n```\n\nUse `<Timeline />` here.";
    expect(() => check(valid((s) => (s === "problem" ? chapter(s, fenced) : undefined)))).not.toThrow();
  });

  it("names the file in every error", () => {
    expect(() => check("Just text.")).toThrow(FILE);
  });
});

// Each row of contracts/build-errors.md asserts the file and the contract phrase together (the build run in
// tests/build/project-validation.test.ts proves the route calls this check; see docs/testing.md).
describe("validateProjectBody messages (contracts/build-errors.md)", () => {
  const inProblem = (inner: string) => valid((s) => (s === "problem" ? chapter(s, inner) : undefined));
  const swapped = [...stageIds];
  [swapped[3], swapped[4]] = [swapped[4]!, swapped[3]!];
  const cases: [string, string, Settings, string[]][] = [
    [
      "row 09: a missing chapter",
      stageIds.filter((s) => s !== "lessons").map((s) => chapter(s)).join("\n\n"),
      {},
      ["is missing the chapter", "lessons"],
    ],
    ["row 10: chapters out of order", swapped.map((s) => chapter(s)).join("\n\n"), {}, ["out of order", stageIds[4]!]],
    ["row 11: a repeated chapter", valid() + "\n\n" + chapter("outcome"), {}, ["more than once", "outcome"]],
    [
      "row 16: no OptionComparison block",
      valid((s) => (s === "options" ? chapter(s, "Text.") : undefined)),
      {},
      ["OptionComparison"],
    ],
    ["row 23: an unknown block lists the blocks", inProblem("<Timeline />"), {}, ["<Timeline>", ...storyBlockNames]],
    ["row 24: an unknown visual name", valid((s) => (s === "problem" ? chapter(s, undefined, ' visual="ghost"') : undefined)), {}, ["ghost"]],
    [
      "row 25: the demo visual without embed",
      valid((s) => (s === "built" ? chapter(s, "<Demo />", ' visual="demo"') : undefined)),
      { demoLinks: true },
      ["embed"],
    ],
    ["row 28: a level-two heading", inProblem("## Sub"), {}, ["use ### for headings"]],
    ["row 29: a body image without alt text", inProblem("![](./a.png)"), {}, ["alt text"]],
    [
      "row 30: the Invitation block missing",
      valid((s) => (s === "invitation" ? chapter(s, "Text.") : undefined)),
      {},
      ["Invitation"],
    ],
    ["row 30: the Demo block missing when demo links are set", valid(), { demoLinks: true }, ["Demo"]],
  ];
  it.each(cases)("%s names the file and the phrase", (_name, body, settings, phrases) => {
    const run = () => check(body, settings);
    expect(run).toThrow(FILE);
    for (const phrase of phrases) expect(run).toThrow(phrase);
  });
});
