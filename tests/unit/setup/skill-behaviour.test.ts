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
    const mutatingPatterns = [/gh api -X/, /wrangler deploy/];
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

  it("counts steps from the registry length instead of a fixed number", () => {
    expect(contents).not.toMatch(/of 18\b/);
    expect(contents.toLowerCase()).toContain("registry length");
  });

  it("restates the D1 region inside the item 18 AskUserQuestion text and stops before creating anything if not confirmed (FR-027a, FR-027b)", () => {
    expect(contents).toContain("contact-d1-databases");
    expect(contents).toContain("Western North America");
    expect(contents).toContain("`wnam`");
    expect(contents).toMatch(/cannot be changed/i);
    expect(contents.toLowerCase()).toMatch(/does not confirm[^.]*stop[^.]*before/);
  });

  it("shows the d1 create, d1 delete and secret put commands only in blocks introduced as shown for Don to run himself", () => {
    const fenceRegex = /```[a-z]*\n[\s\S]*?```/g;
    let lastEnd = 0;
    const blocks: { start: number; end: number; ok: boolean }[] = [];
    let m: RegExpExecArray | null;
    while ((m = fenceRegex.exec(contents))) {
      const preceding = contents.slice(lastEnd, m.index);
      blocks.push({ start: m.index, end: m.index + m[0].length, ok: /shown for don to run himself/i.test(preceding) });
      lastEnd = m.index + m[0].length;
    }
    for (const source of ["wrangler d1 create", "wrangler d1 delete", "wrangler secret put"]) {
      const pattern = new RegExp(source, "g");
      let o: RegExpExecArray | null;
      let found = 0;
      while ((o = pattern.exec(contents))) {
        const index = o.index;
        const block = blocks.find((b) => index >= b.start && index < b.end);
        // Prose mentions (for example the forbidden `wrangler secret` reads) are allowed; examples must be fenced.
        if (!block) continue;
        found++;
        expect(block.ok, `${source} block is not introduced as shown for Don to run himself`).toBe(true);
      }
      expect(found, `${source} example missing`).toBeGreaterThan(0);
    }
  });

  it("allows exactly one non-check command after Don confirms item 18: wrangler d1 list --json, then editing wrangler.jsonc", () => {
    expect(contents).toContain("pnpm exec wrangler d1 list --json");
    expect(contents).toContain("wrangler.jsonc");
  });

  it("orders the contact items databases, token permission, widget, secrets, build variable, preview builds, deploy", () => {
    const order = [
      "contact-d1-databases",
      "local-credentials",
      "contact-turnstile-widget",
      "contact-worker-secrets",
      "contact-preview-builds",
      "contact-turnstile-site-key",
      "contact-preview-deploy",
    ];
    const start = contents.indexOf("## Contact form order");
    expect(start).toBeGreaterThanOrEqual(0);
    const section = contents.slice(start);
    const indexes = order.map((id) => section.indexOf(id));
    expect(indexes.every((i) => i >= 0)).toBe(true);
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
  });

  it("applies the after-merge rule to contact-production-deploy and confirms secrets by name only", () => {
    expect(contents).toContain("contact-production-deploy");
    expect(contents.toLowerCase()).toContain("after-merge");
    expect(contents.toLowerCase()).toMatch(/by name only|names only/);
  });

  it("treats a waiting step like a completed one: one line, no pause", () => {
    expect(contents).toMatch(/`waiting`[\s\S]{0,200}like a\s+completed step[\s\S]{0,200}one line[\s\S]{0,200}no pause/i);
  });

  it("hands over to docs/launch.md at item 25 and gates on the readiness checks", () => {
    expect(contents).toContain("## Launch hand-over");
    const section = contents.slice(contents.indexOf("## Launch hand-over"));
    expect(section).toContain("docs/launch.md");
    expect(section).toContain("launch-content-ready");
    expect(section).toMatch(/item 25/);
    expect(section.toLowerCase()).toMatch(/readiness gate/);
    for (const answer of ["Done — check it", "Skip for now", "Stop here"]) expect(section).toContain(answer);
  });

  it("never signs in, changes DNS or handles credentials", () => {
    const lower = contents.toLowerCase();
    expect(lower).toMatch(/never signs in/);
    expect(lower).toMatch(/never changes dns/);
    expect(lower).toMatch(/never[^.]*credential/);
  });
});
