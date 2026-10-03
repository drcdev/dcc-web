// Guards the issue #26 D7 test-placement rule across the four pipelines, the constitution and
// docs/testing.md. CLAUDE.md lists this text as a shared section.
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

function constitutionText(): string {
  return readFileSync(
    fileURLToPath(new URL("../../../.specify/memory/constitution.md", import.meta.url)),
    "utf-8",
  );
}

function testingDocText(): string {
  return readFileSync(fileURLToPath(new URL("../../../docs/testing.md", import.meta.url)), "utf-8");
}

// Line wrapping in the text must not matter to the phrase checks.
function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

// Text from a heading up to the next marker (or the end of the file).
function slice(text: string, from: string, to: string): string {
  const start = text.indexOf(from);
  expect(start, `heading ${from} present`).toBeGreaterThanOrEqual(0);
  const end = text.indexOf(to, start + from.length);
  return end === -1 ? text.slice(start) : text.slice(start, end);
}

const bullet = flat(
  "**Test placement.** Every behaviour gets one primary layer: the cheapest layer that can " +
    "observe it. E2E is for journeys and for anything only a browser can show; build tests are " +
    "for what only the real build can show; accessibility and visual tests cover templates, not " +
    "stories. Every planned test (a test task, a reproducing test or a work item's test) names " +
    "its layer (unit, component, build, worker, E2E, accessibility, visual or budget), and " +
    "testing the same behaviour at a second layer needs a written reason. The constitution's " +
    'Development Workflow makes this binding; "Where a test goes" in `docs/testing.md` has the ' +
    "detail.",
);

const taskPhrase = flat(
  "Each test task names its one primary layer, the cheapest layer that can observe the " +
    'behaviour ("Where a test goes" in `docs/testing.md`), and gives the reason for any second ' +
    "layer in the task text.",
);

const squashFixPhrase = flat(
  "at its one primary layer, the cheapest layer that can observe the symptom " +
    '("Where a test goes" in `docs/testing.md`)',
);

const squashAssessPhrase = "Name the layer the reproducing test belongs at.";

const chorePlanPhrase = flat(
  "for a new or moved test, its one primary layer, the cheapest layer that can observe the " +
    'behaviour ("Where a test goes" in `docs/testing.md`), with the reason for any second layer',
);

const choreImplementPhrase = "write or adjust the test the plan names, at the layer it names,";

const choreReviewPhrase = "every new or moved test at the layer the plan names;";

const stale = {
  deliver: "every story gets unit/schema, component, E2E and accessibility test tasks",
  tweak: "an E2E or accessibility case where the change is visible in the browser",
  squash: "whichever layer the bug lives in",
};

describe.each(pipelines)(".claude/skills/%s/SKILL.md test placement", (name) => {
  it("has the Test placement bullet exactly once", () => {
    expect(count(flat(skillText(name)), bullet)).toBe(1);
  });
});

describe("test placement layer-naming phrases", () => {
  it("deliver names the layer in the tasks row", () => {
    expect(count(flat(skillText("deliver")), taskPhrase)).toBe(1);
  });

  it("tweak names the layer in the tasks row", () => {
    expect(count(flat(skillText("tweak")), taskPhrase)).toBe(1);
  });

  it("squash names the layer in the fix row", () => {
    expect(count(flat(skillText("squash")), squashFixPhrase)).toBe(1);
  });

  it("squash names the layer in the assess row", () => {
    expect(count(flat(skillText("squash")), squashAssessPhrase)).toBe(1);
  });

  it("chore names the layer in the plan row", () => {
    expect(count(flat(skillText("chore")), chorePlanPhrase)).toBe(1);
  });

  it("chore names the layer in the implement step", () => {
    expect(count(flat(skillText("chore")), choreImplementPhrase)).toBe(1);
  });

  it("chore checks the layer in the review row", () => {
    expect(count(flat(skillText("chore")), choreReviewPhrase)).toBe(1);
  });
});

describe("stale per-story layer lists", () => {
  it("deliver no longer lists a fixed layer set per story", () => {
    expect(flat(skillText("deliver"))).not.toContain(stale.deliver);
  });

  it("tweak no longer asks for an E2E case wherever the change is visible", () => {
    expect(flat(skillText("tweak"))).not.toContain(stale.tweak);
  });

  it("squash no longer leaves the layer to wherever the bug lives", () => {
    expect(flat(skillText("squash"))).not.toContain(stale.squash);
  });
});

describe("test placement alignment", () => {
  it("puts the same Test placement bullet in deliver, tweak, squash and chore", () => {
    for (const name of pipelines) {
      expect(count(flat(skillText(name)), bullet), `${name}: bullet`).toBe(1);
    }
  });
});

describe("constitution test placement", () => {
  it("carries the rule in Development Workflow", () => {
    const section = flat(slice(constitutionText(), "## Development Workflow", "## Governance"));
    expect(section).toContain("one primary layer");
    expect(section).toContain("names its layer");
  });
});

describe("docs/testing.md test placement", () => {
  it("has the Where a test goes section with the rule and the constitution pointer", () => {
    const text = testingDocText();
    expect(text).toContain("## Where a test goes");
    const section = flat(slice(text, "## Where a test goes", "\n## "));
    expect(section).toContain("one primary layer");
    expect(section).toContain("Development Workflow");
  });
});
