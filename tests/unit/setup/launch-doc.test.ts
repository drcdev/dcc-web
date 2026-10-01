import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setupItems } from "../../../scripts/setup-check/items.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const read = (path: string): string => readFileSync(`${repoRoot}${path}`, "utf-8");

const doc = read("docs/launch.md");
const baseline = JSON.parse(read("setup/dns-baseline.json")) as {
  records: { type: string; name: string; content: string; ttl: number; decision: string }[];
};

// Part F (T1 to T9) is added and tested in the retirement phase.
const STEP_IDS = [
  ...Array.from({ length: 18 }, (_, i) => `L${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `R${i + 1}`),
];
const PAUSE_STEPS = [
  "L2", "L3", "L5", "L8", "L9", "L10", "L11", "L12", "L14", "L15", "L16", "L17",
  "R1", "R2", "R3", "R4",
];
const PARTS = ["A", "B", "C", "D", "E"];

function steps(): { id: string; body: string }[] {
  const matches = [...doc.matchAll(/^### ([LRT]\d+)\. .*\{#([lrt]\d+)\}\s*$/gm)];
  return matches.map((m, i) => {
    expect(m[2]).toBe(m[1]!.toLowerCase());
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : doc.length;
    const rest = doc.slice(m.index!, end);
    const nextPart = rest.search(/^## /m);
    return { id: m[1]!, body: nextPart > 0 ? rest.slice(0, nextPart) : rest };
  });
}
const step = (id: string): string => steps().find((s) => s.id === id)?.body ?? "";

describe("docs/launch.md structure", () => {
  it("has parts A to E in order, each with an anchor", () => {
    const found = [...doc.matchAll(/^## Part ([A-F])\b.*\{#[a-z-]+\}\s*$/gm)].map((m) => m[1]);
    expect(found).toEqual(PARTS);
  });

  it("has the step ids L1 to L18 then R1 to R5, in order, with anchors", () => {
    expect(steps().map((s) => s.id)).toEqual(STEP_IDS);
  });

  it("puts each step under its own part", () => {
    const at = (re: RegExp) => doc.search(re);
    expect(at(/\{#l1\}/)).toBeGreaterThan(at(/\{#part-a\}/));
    expect(at(/\{#l8\}/)).toBeGreaterThan(at(/\{#part-b\}/));
    expect(at(/\{#l11\}/)).toBeGreaterThan(at(/\{#part-c\}/));
    expect(at(/\{#l14\}/)).toBeGreaterThan(at(/\{#part-d\}/));
    expect(at(/\{#r1\}/)).toBeGreaterThan(at(/\{#rollback\}/));
  });

  it("gives Part E the #rollback anchor that docs/setup.md links to", () => {
    expect(doc).toMatch(/^## Part E .*\{#rollback\}/m);
    expect(read("docs/setup.md")).toContain("docs/launch.md#rollback");
  });

  it.each(STEP_IDS)("step %s has What to do, Where, How to confirm in order and a failure outcome", (id) => {
    const body = step(id);
    const a = body.indexOf("**What to do**");
    const b = body.indexOf("**Where**");
    const c = body.indexOf("**How to confirm**");
    const d = body.indexOf("**If it does not confirm**");
    expect(a).toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(d).toBeGreaterThan(c);
    expect(body.slice(d).length).toBeGreaterThan(60);
  });

  it.each(PAUSE_STEPS)("step %s has a Pause line naming the three answers", (id) => {
    const body = step(id);
    expect(body).toContain("**Pause:**");
    const line = body.split("\n").find((l) => l.startsWith("**Pause:**"))!;
    for (const answer of ["Done — check it", "Skip for now", "Stop here"]) expect(line).toContain(answer);
  });

  it("intro states the part order, that the switch follows the merge, the 2-week window and the agent/Don boundary", () => {
    const intro = doc.slice(0, doc.indexOf("## Part A"));
    expect(intro).toMatch(/Part A/);
    expect(intro).toMatch(/Part E/);
    expect(intro).toMatch(/only after[^.]*pull request[^.]*merged|merged[^.]*before[^.]*switch/i);
    expect(intro).toMatch(/2 weeks|two weeks/i);
    expect(intro).toMatch(/never signs in/i);
    expect(intro).toMatch(/credential/i);
  });
});

describe("docs/launch.md Part A readiness", () => {
  it("L2 names launch-content-ready and L3 compares the Ghost post list with /writing/", () => {
    expect(step("L2")).toContain("pnpm setup:check --item launch-content-ready");
    expect(step("L3")).toContain("/writing/");
  });

  it("L4 runs the crawl with the expected origin", () => {
    const s = step("L4");
    expect(s).toContain("--base https://new.doncoleman.ca");
    expect(s).toContain("--expect-origin https://doncoleman.ca");
  });

  it("L5 and L14 use Launch test messages and delete them", () => {
    for (const id of ["L5", "L14"]) {
      expect(step(id)).toContain("Launch test");
      expect(step(id).toLowerCase()).toMatch(/delete/);
    }
    expect(step("L5")).toContain("--item contact-turnstile-widget");
  });

  it("L6 confirms through launch-main-checks", () => {
    expect(step("L6")).toContain("--item launch-main-checks");
  });

  it("L7 is a gate listing L1 to L6 and stops the walkthrough", () => {
    const s = step("L7");
    for (const id of ["L1", "L2", "L3", "L4", "L5", "L6"]) expect(s).toContain(id);
    expect(s.toLowerCase()).toMatch(/stop/);
    expect(s).toContain("Part B");
  });

  it("L1 expects item 16 to report waiting", () => {
    expect(step("L1")).toMatch(/waiting/);
    expect(step("L1")).toContain("pnpm setup:check");
  });
});

describe("docs/launch.md Parts B to D", () => {
  const web = baseline.records.filter(
    (r) => r.decision === "keep" && ["A", "AAAA", "CNAME"].includes(r.type) && /^(www\.)?doncoleman\.ca$/.test(r.name),
  );

  it("the baseline has the Ghost web records the walkthrough records", () => {
    expect(web.length).toBe(2);
  });

  it("L8's table equals the Ghost web records: type, name, content, DNS only, TTL", () => {
    const s = step("L8");
    const rows = s.split("\n").filter((l) => l.startsWith("|") && !/^\|[\s-|]+\|$/.test(l)).slice(1);
    expect(rows.length).toBe(web.length);
    for (const r of web) {
      const row = rows.find((l) => l.includes(`\`${r.name}\``));
      expect(row, `no L8 row for ${r.name}`).toBeDefined();
      expect(row).toContain(`\`${r.type}\``);
      expect(row).toContain(`\`${r.content}\``);
      expect(row).toMatch(/DNS only/);
      expect(row).toContain(String(r.ttl));
    }
    expect(s).toContain("--item dns-records-parity");
    expect(s).toContain("--item live-domain-ghost");
    expect(s.toLowerCase()).toMatch(/export/);
  });

  it("R2 and R3 name the same TTL as the baseline", () => {
    for (const id of ["R2", "R3"]) {
      expect(step(id)).toContain("14400");
      expect(step(id)).toContain("4 hr");
    }
  });

  it("L9 sends the mail test and L10 turns on Always Use HTTPS", () => {
    expect(step("L9").toLowerCase()).toMatch(/email to and from/);
    expect(step("L9")).toContain("--item mail-records");
    expect(step("L9")).toContain("Part E");
    expect(step("L10")).toContain("Always Use HTTPS");
  });

  it("L11 does the bare domain first and L12 states the one-sitting both-halves rule", () => {
    expect(step("L11")).toContain("Custom Domain");
    expect(step("L11")).toContain("--item live-apex");
    expect(step("L11").toLowerCase()).toContain("renewal");
    const s12 = step("L12");
    expect(s12).toContain("100::");
    expect(s12.toLowerCase()).toMatch(/same sitting/);
    expect(s12).toContain("Part E");
    expect(s12).toContain("--item live-www-redirect");
    expect(s12.toLowerCase()).toMatch(/half/);
  });

  it("L13 states the 5 minute lifetime, pending, and the 24 hour limit", () => {
    const s = step("L13");
    expect(s).toMatch(/5 minutes/);
    expect(s).toMatch(/Auto/);
    expect(s).toMatch(/24 hours/);
    expect(s).toContain("Problem:");
  });

  it("L14 checks items 28 to 32, the mail test, and lists the four rollback triggers", () => {
    const s = step("L14");
    for (const id of ["live-apex", "live-www-redirect", "live-sitemap", "live-contact-endpoint", "mail-records"]) {
      expect(s).toContain(id);
    }
    expect(s).toMatch(/email to and from/);
    expect(s).toMatch(/unfixable|cannot be fixed/);
    expect(s).toMatch(/mail record/);
    expect(s).toMatch(/24 hours/);
    expect(s).toMatch(/unusable/);
    expect(s).toMatch(/Don decides/);
  });

  it("L15 comes directly after L14 and covers external links", () => {
    const ids = steps().map((x) => x.id);
    expect(ids.indexOf("L15")).toBe(ids.indexOf("L14") + 1);
    expect(step("L15").toLowerCase()).toMatch(/external|linkedin/);
    expect(step("L15").toLowerCase()).toMatch(/not redirected/);
  });

  it("L16 removes the review address and its DNS record", () => {
    const s = step("L16");
    expect(s).toContain("new.doncoleman.ca");
    expect(s).toContain("--item review-address-removed");
    expect(s.toLowerCase()).toMatch(/dns record/);
    expect(s.toLowerCase()).toMatch(/resolve/);
  });

  it("L17 is optional Search Console and L18 notes the switch date and the 2-week rule", () => {
    expect(step("L17")).toContain("sitemap-index.xml");
    expect(step("L17").toLowerCase()).toContain("optional");
    expect(step("L18")).toMatch(/2 weeks/);
  });
});

describe("docs/launch.md Part E rollback", () => {
  const partE = doc.slice(doc.indexOf("## Part E"));
  const intro = partE.slice(0, partE.indexOf("### R1"));

  it("says rollback is impossible once Ghost is cancelled and needs no search-engine step", () => {
    expect(intro.toLowerCase()).toMatch(/impossible once ghost is cancelled/);
    expect(intro.toLowerCase()).toMatch(/does not need the review address|independent of the review address/);
    expect(intro.toLowerCase()).toMatch(/search-engine step|indexing step/);
  });

  it("names every Ghost record from L8, with TTL", () => {
    for (const r of baseline.records.filter(
      (x) => x.decision === "keep" && ["A", "CNAME"].includes(x.type) && /^(www\.)?doncoleman\.ca$/.test(x.name),
    )) {
      expect(partE).toContain(r.content);
    }
    expect(partE).toContain("14400");
  });

  it("R1 to R4 undo the switch and R5 confirms Ghost is back", () => {
    expect(step("R1")).toContain("Custom Domain");
    expect(step("R2")).toContain("49.13.201.194");
    expect(step("R3")).toContain("100::");
    expect(step("R3")).toContain("drift-and-convergence.mymagic.page");
    expect(step("R4")).toContain("Redirect Rule");
    const r5 = step("R5");
    expect(r5).toContain("still resolves to the recorded Ghost targets");
    expect(r5).toContain("--item dns-records-parity");
    expect(r5).toContain("--item mail-records");
  });
});

describe("docs/launch.md safety", () => {
  it("never puts paste next to chat except in a never sentence", () => {
    const sentences = doc.split(/(?<=[.!?])\s+|\n\n/);
    for (const s of sentences) {
      if (/paste/i.test(s) && /chat/i.test(s)) {
        expect(s.toLowerCase(), `unsafe sentence: ${s}`).toMatch(/never/);
      }
    }
  });

  it("every setup:check item named is a registry id", () => {
    const ids = new Set(setupItems.map((i) => i.id));
    const named = [...doc.matchAll(/--item ([a-z0-9-]+)/g)].map((m) => m[1]!);
    expect(named.length).toBeGreaterThan(10);
    for (const id of named) expect(ids.has(id), `${id} is not a registry id`).toBe(true);
  });

  it("docs/setup.md intro links to docs/launch.md and its Launch part precedes section 26", () => {
    const setup = read("docs/setup.md");
    expect(setup.slice(0, setup.indexOf("## 1."))).toContain("docs/launch.md");
    expect(setup.indexOf("# Launch")).toBeLessThan(setup.indexOf("{#launch-content-ready}"));
  });
});
