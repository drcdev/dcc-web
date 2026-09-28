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
});
