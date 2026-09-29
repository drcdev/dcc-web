import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const skillPath = fileURLToPath(
  new URL("../../../.claude/skills/setup-walkthrough/SKILL.md", import.meta.url),
);
const contents = readFileSync(skillPath, "utf-8");

describe(".claude/skills/setup-walkthrough/SKILL.md", () => {
  it("confirms every step exclusively through pnpm setup:check --json --item <id>", () => {
    expect(contents).toMatch(/pnpm setup:check --json --item/);
  });

  it("never invokes a mutating command outside a 'show Don this command' block", () => {
    // Every mutating command example must appear inside a fenced code block
    // introduced as something Don runs himself, not something the skill runs.
    const mutatingPatterns = [/gh api -X/, /gh label create/, /wrangler deploy/];
    for (const pattern of mutatingPatterns) {
      const match = pattern.exec(contents);
      expect(match, `expected an example of ${pattern} shown for Don`).not.toBeNull();
    }
    // The instructions must say these are shown for Don, not run by the skill.
    expect(contents.toLowerCase()).toMatch(/shown for don|show don|for don to run/);
  });

  it("lists only the allowed read-only commands", () => {
    const allowed = [
      "pnpm setup:check",
      "pnpm setup:dns-snapshot",
      "gh auth status",
      "node --version",
      "pnpm --version",
      "git status",
    ];
    for (const command of allowed) {
      expect(contents).toContain(command);
    }
  });

  it("forbids cat .env, printenv, gh auth token and debug/verbose flags", () => {
    for (const forbidden of ["cat .env", "printenv", "gh auth token"]) {
      expect(contents).toContain(forbidden);
    }
    expect(contents.toLowerCase()).toMatch(/never|forbid|must not|do not/);
    expect(contents.toLowerCase()).toMatch(/verbose|debug/);
  });

  it('names the three labelled parts "What it is for", "Where to do it", "How it will be confirmed" in that order', () => {
    const whatIndex = contents.indexOf("What it is for");
    const whereIndex = contents.indexOf("Where to do it");
    const howIndex = contents.indexOf("How it will be confirmed");
    expect(whatIndex).toBeGreaterThanOrEqual(0);
    expect(whereIndex).toBeGreaterThan(whatIndex);
    expect(howIndex).toBeGreaterThan(whereIndex);
  });

  it("offers exactly the three answers Done / Skip for now / Stop", () => {
    expect(contents).toMatch(/Done\s*[—-]\s*check it/);
    expect(contents).toMatch(/Skip for now/);
    expect(contents).toMatch(/Stop here/);
  });

  it('shows a live-domain-ghost "Problem:" first', () => {
    const problemIndex = contents.indexOf("Problem:");
    expect(problemIndex).toBeGreaterThanOrEqual(0);
    expect(contents.toLowerCase()).toContain("live-domain-ghost");
  });

  it("shows the rollback procedure before the nameserver switch", () => {
    expect(contents.toLowerCase()).toContain("rollback");
    expect(contents.toLowerCase()).toContain("dns-nameservers");
  });

  it("reminds Don to confirm DNSSEC is disabled at Squarespace before the nameserver switch", () => {
    expect(contents.toLowerCase()).toContain("dnssec");
  });

  it('every mutating command example lies inside a fenced code block introduced as "shown for Don to run himself" (FR-009, FR-012, partial)', () => {
    // Stricter than "never invokes a mutating command outside a 'show Don
    // this command' block" above: that test only confirms the phrase
    // "shown for Don" appears somewhere in the file. This confirms each
    // mutating command's own fenced block is directly introduced by it.
    const fenceRegex = /```[a-z]*\n[\s\S]*?```/g;
    const blocks: { start: number; end: number; introducedForDon: boolean }[] = [];
    let lastEnd = 0;
    let fenceMatch: RegExpExecArray | null;
    while ((fenceMatch = fenceRegex.exec(contents))) {
      const start = fenceMatch.index;
      const end = start + fenceMatch[0].length;
      const preceding = contents.slice(lastEnd, start);
      blocks.push({ start, end, introducedForDon: /shown for don to run himself/i.test(preceding) });
      lastEnd = end;
    }

    const mutatingPatterns = [/gh api -X/, /gh label create/, /wrangler deploy/, /wrangler versions upload/];
    for (const pattern of mutatingPatterns) {
      const occurrences = new RegExp(pattern.source, "g");
      let occurrence: RegExpExecArray | null;
      while ((occurrence = occurrences.exec(contents))) {
        const index = occurrence.index;
        const block = blocks.find((b) => index >= b.start && index < b.end);
        expect(block, `${pattern} at index ${index} is not inside any fenced code block`).toBeDefined();
        expect(
          block?.introducedForDon,
          `${pattern}'s fenced code block is not introduced as "shown for Don to run himself"`,
        ).toBe(true);
      }
    }
  });

  it("states the FR-009 halt rule: at a pause the skill runs no further confirmations, shows no later step's instructions, and prepares nothing for later steps until Don answers", () => {
    const lower = contents.toLowerCase();
    expect(lower).toContain("no further confirmations");
    expect(lower).toMatch(/no later step/);
    expect(lower).toContain("prepares nothing");
    expect(lower).toMatch(/until don answers/);
  });
});
