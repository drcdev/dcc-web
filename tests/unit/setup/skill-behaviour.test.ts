import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const skillPath = fileURLToPath(
  new URL("../../../.claude/skills/setup-walkthrough/SKILL.md", import.meta.url),
);
const contents = readFileSync(skillPath, "utf-8");

describe(".claude/skills/setup-walkthrough/SKILL.md", () => {
  it("lists only the allowed read-only commands", () => {
    const allowed = [
      "pnpm setup:check",
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

  it("has a contact email step: drc.dev sending domain, no doncoleman.ca DNS change, destination check, token permissions, secret deletion shown for Don", () => {
    const start = contents.indexOf("## Contact email (item 17)");
    expect(start).toBeGreaterThan(-1);
    const section = contents.slice(start);
    expect(section).toContain("drc.dev");
    expect(section).not.toMatch(/mail\.doncoleman\.ca|Subdomains/);
    expect(section).toMatch(/no DNS change on doncoleman\.ca/i);
    expect(section).toContain("contact@doncoleman.ca");
    expect(section).toContain("Email Routing Addresses: Read");
    expect(section).toContain("Zone Settings: Read");
    expect(section).toMatch(/7 days/);
    const delIndex = section.indexOf("wrangler secret delete");
    expect(delIndex).toBeGreaterThan(-1);
    expect(section.slice(0, delIndex)).toMatch(/shown for Don to run himself/i);
    expect(section).toContain("--env-file /dev/null");
  });

  it("never signs in, changes DNS or handles credentials", () => {
    const lower = contents.toLowerCase();
    expect(lower).toMatch(/never signs in/);
    expect(lower).toMatch(/never changes dns/);
    expect(lower).toMatch(/never[^.]*credential/);
  });
});
