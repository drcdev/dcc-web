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

// Line wrapping in the skill text must not matter to the phrase checks.
function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const paragraph = flat(
  "**Inner loop and gate.** `pnpm run verify:quick` runs secret lint, lint, type check, the unit " +
    "and component tests, the worker tests and the real `astro build`. It is the inner-loop check " +
    "for implement and fix subagents. It leaves out the build-fixture tests and every Playwright " +
    "project, so it never counts as the gate. The full `pnpm run verify` runs the whole gate " +
    "(secret lint, lint, type check, unit, component, build-fixture and worker tests, build, and " +
    "every Playwright project — E2E, accessibility, sections, performance budget and visual), and " +
    "it is the only check that counts before a PR. There is no scoped or tiered local gate: a " +
    "`src/` change means the whole suite runs again. CI runs the same gate as parallel jobs and " +
    "narrows it only by the changed paths, as `docs/testing.md` describes.",
);

const sentence = flat(
  "Then run `pnpm run verify:quick` under the perl alarm as the inner-loop check; only the full " +
    "`pnpm run verify`, which the orchestrator runs before the PR, counts as the gate.",
);

const staleSentence = "There is no scoped or tiered E2E in this project";

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe.each(pipelines)(".claude/skills/%s/SKILL.md verify wording", (name) => {
  it("has the Inner loop and gate paragraph exactly once", () => {
    expect(count(flat(skillText(name)), paragraph)).toBe(1);
  });

  it("has the verify:quick inner-loop sentence exactly once", () => {
    expect(count(flat(skillText(name)), sentence)).toBe(1);
  });

  it("no longer says there is no scoped or tiered E2E", () => {
    expect(flat(skillText(name))).not.toContain(staleSentence);
  });
});

describe("verify wording alignment", () => {
  it("puts the same paragraph and sentence in deliver, tweak, squash and chore", () => {
    for (const name of pipelines) {
      const text = flat(skillText(name));
      expect(count(text, paragraph), `${name}: paragraph`).toBe(1);
      expect(count(text, sentence), `${name}: sentence`).toBe(1);
      expect(text, `${name}: stale wording`).not.toContain(staleSentence);
    }
  });

  it("names a verify:quick script that package.json defines", () => {
    const pkg = JSON.parse(
      readFileSync(fileURLToPath(new URL("../../../package.json", import.meta.url)), "utf-8"),
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts["verify:quick"]).toBeTruthy();
  });
});
