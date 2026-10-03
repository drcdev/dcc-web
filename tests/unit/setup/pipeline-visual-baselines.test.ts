// Guards the shared visual-baselines wording across the four pipelines and CLAUDE.md
// (issue #40). CLAUDE.md lists this text as a shared section.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pipelines = ["deliver", "tweak", "squash", "chore"] as const;

function skillText(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../../.claude/skills/${name}/SKILL.md`, import.meta.url)),
    "utf-8",
  );
}

function claudeText(): string {
  return readFileSync(fileURLToPath(new URL("../../../CLAUDE.md", import.meta.url)), "utf-8");
}

// Line wrapping in the text must not matter to the phrase checks.
function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const sentences = {
  S1:
    "The visual project snapshots only the shell (header, footer and open mobile menu), the " +
    "not-found page and the fixture site, never real content, so a content edit cannot fail it.",
  S2:
    "Its per-platform baselines change only when the shell, a template or the design system " +
    "changes, which is a major change under Principle III in any case.",
  S3: "A visual diff nobody predicted up front is a regression to fix, not a baseline to refresh.",
};

const stale = "compares each snapshotted page";

const sources: Array<[string, () => string]> = [
  ...pipelines.map((name): [string, () => string] => [
    `.claude/skills/${name}/SKILL.md`,
    () => skillText(name),
  ]),
  ["CLAUDE.md", claudeText],
];

describe.each(sources)("%s visual baselines wording", (_label, read) => {
  for (const [key, sentence] of Object.entries(sentences)) {
    it(`has ${key} exactly once`, () => {
      expect(count(flat(read()), flat(sentence))).toBe(1);
    });
  }

  it("no longer says the project compares each snapshotted page", () => {
    expect(flat(read())).not.toContain(stale);
  });
});
