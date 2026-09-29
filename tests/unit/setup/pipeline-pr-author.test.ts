import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pipelines = ["deliver", "tweak", "squash"] as const;

function skillText(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../../.claude/skills/${name}/SKILL.md`, import.meta.url)),
    "utf-8",
  );
}

const startMarker = "**PR author account (required).**";

// The account-switch block runs from its marker to the next Finish step ("5. ").
function authorBlock(name: string): string {
  const contents = skillText(name);
  const start = contents.indexOf(startMarker);
  expect(start, `${name}: expected the PR author account block`).toBeGreaterThanOrEqual(0);
  const end = contents.indexOf("\n5. ", start);
  expect(end, `${name}: expected the block to end before Finish step 5`).toBeGreaterThan(start);
  return contents.slice(start, end);
}

// Line wrapping in the skill text must not matter to the phrase checks.
function flatBlock(name: string): string {
  return authorBlock(name).replace(/\s+/g, " ");
}

describe.each(pipelines)(".claude/skills/%s/SKILL.md PR author account", (name) => {
  it("switches to drc-agents before gh pr create and back to drcdev straight after", () => {
    const block = flatBlock(name);
    const toAgents = block.indexOf("gh auth switch --user drc-agents");
    const create = block.indexOf("gh pr create");
    const toOwner = block.indexOf("gh auth switch --user drcdev");
    expect(toAgents).toBeGreaterThanOrEqual(0);
    expect(create).toBeGreaterThan(toAgents);
    expect(toOwner).toBeGreaterThan(create);
    expect(block.toLowerCase()).toMatch(/whether it succeeded or failed/);
  });

  it("verifies the PR author with gh pr view --json author and stops unless drc-agents", () => {
    const block = flatBlock(name);
    expect(block).toMatch(/gh pr view <n> --json author/);
    expect(block).toMatch(/author\.login/);
    expect(block.toLowerCase()).toMatch(/not `drc-agents`[\s\S]*stop/);
  });

  it("stops and asks Don when the switch is denied or the account is missing, never opening as drcdev", () => {
    const block = flatBlock(name);
    expect(block).toMatch(/denied/);
    expect(block).toMatch(/keyring/);
    expect(block).toMatch(/AskUserQuestion/);
    expect(block.toLowerCase()).toMatch(/never open the pr as `drcdev`/);
  });
});

describe("PR author account block alignment", () => {
  it("is identical text in deliver, tweak and squash", () => {
    const [first, ...rest] = pipelines.map(authorBlock);
    for (const other of rest) {
      expect(other).toBe(first);
    }
  });
});
