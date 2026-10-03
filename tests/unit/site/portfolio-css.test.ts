// Every motion effect in the portfolio stylesheet is guarded (US5; FR-016 to FR-018,
// FR-025; contracts/pages-dom.md "Motion"). The stylesheet is parsed into rules with
// the chain of at-rule preludes that wrap each one, so a guard is checked by
// structure, not by search.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../../../src/components/project/portfolio.css", import.meta.url)),
  "utf-8",
).replace(/\/\*[\s\S]*?\*\//g, "");

interface Rule {
  guards: string[];
  prelude: string;
  body: string;
}

function parse(text: string, guards: string[] = []): Rule[] {
  const rules: Rule[] = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open === -1) break;
    const prelude = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth += 1;
      else if (text[j] === "}") depth -= 1;
      j += 1;
    }
    const body = text.slice(open + 1, j - 1);
    if (/^@(media|supports|layer)/.test(prelude)) {
      rules.push(...parse(body, [...guards, prelude]));
    } else {
      rules.push({ guards, prelude, body });
    }
    i = j;
  }
  return rules;
}

const rules = parse(source);
const withProperty = (property: string) => rules.filter((r) => new RegExp(`(^|[;\\s])${property}\\s*:`).test(r.body));
const NO_PREFERENCE = "prefers-reduced-motion: no-preference";

describe("portfolio.css motion", () => {
  it("guards every scroll-driven animation by no-preference and animation-timeline support", () => {
    const driven = withProperty("animation-timeline");
    expect(driven.length).toBeGreaterThanOrEqual(1);
    for (const rule of driven) {
      expect(rule.guards.join(" ")).toContain(NO_PREFERENCE);
      expect(rule.guards.join(" ")).toContain("@supports (animation-timeline: view())");
    }
  });

  it("drives the progress bar from the root scroll and nothing else", () => {
    const timelines = withProperty("animation-timeline").map((r) => r.body);
    expect(timelines.some((b) => /scroll\(root\)/.test(b))).toBe(true);
    expect(timelines.every((b) => /scroll\(root\)/.test(b))).toBe(true);
  });

  it("keeps each timeline out of the rule that holds the animation shorthand, which would reset or fold it", () => {
    for (const rule of withProperty("animation-timeline")) {
      expect(rule.body).not.toMatch(/(^|[;\s])animation\s*:/);
    }
  });

  it("hides the progress bar by default and in print, and shows it only under the guards", () => {
    const bar = rules.filter((r) => r.prelude === "[data-progress]" || r.prelude === ":root [data-progress]");
    const base = bar.find((r) => r.guards.length === 0);
    expect(base?.body).toMatch(/display:\s*none/);
    const shown = bar.find((r) => /display:\s*block/.test(r.body));
    expect(shown?.guards.join(" ")).toContain(NO_PREFERENCE);
    const print = bar.find((r) => r.guards.some((g) => g.startsWith("@media print")));
    expect(print?.body).toMatch(/display:\s*none/);
    expect(bar.indexOf(print!)).toBeGreaterThan(bar.indexOf(shown!));
  });

  it("has no sticky panel and no heading reveal: a part is plain flowing content (FR-004)", () => {
    expect(rules.filter((r) => /position:\s*sticky/.test(r.body))).toHaveLength(0);
    expect(source).not.toMatch(/portfolio-uncover|data-reveal/);
  });

  it("opts in to cross-document view transitions once, only where motion is allowed", () => {
    const transitions = rules.filter((r) => r.prelude === "@view-transition");
    expect(transitions).toHaveLength(1);
    expect(transitions[0]!.guards.join(" ")).toContain(NO_PREFERENCE);
    expect(transitions[0]!.body).toMatch(/navigation:\s*auto/);
  });

  it("never hides content by default: the resting rules have no clip-path, zero opacity or hidden visibility", () => {
    for (const rule of rules.filter((r) => r.guards.length === 0 && !r.prelude.startsWith("@keyframes"))) {
      expect(rule.body).not.toMatch(/clip-path\s*:/);
      expect(rule.body).not.toMatch(/(^|[;\s])opacity\s*:\s*0/);
      expect(rule.body).not.toMatch(/visibility\s*:\s*hidden/);
    }
  });

  it("keeps focused elements and anchors clear of the bar and the header with a scroll margin", () => {
    const margin = withProperty("scroll-margin-top").find((r) => r.prelude.includes("[id]"));
    expect(margin).toBeDefined();
    const rem = Number(/scroll-margin-top:\s*([\d.]+)rem/.exec(margin!.body)?.[1]);
    expect(rem).toBeGreaterThanOrEqual(5);
  });

  it("gives the progress bar a system colour in forced colours", () => {
    const forced = rules.filter(
      (r) => r.guards.some((g) => g.includes("forced-colors: active")) && r.prelude.includes("[data-progress]"),
    );
    expect(forced.length).toBeGreaterThan(0);
    expect(forced[0]!.body).toMatch(/Highlight/);
  });
});
