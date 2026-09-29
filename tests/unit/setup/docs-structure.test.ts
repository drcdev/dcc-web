import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const docsPath = fileURLToPath(new URL("../../../docs/setup.md", import.meta.url));
const contents = readFileSync(docsPath, "utf-8");

// The spec's fixed item IDs, in walkthrough order (spec.md "Setup items and
// completion conditions"; data-model.md registry table).
const ITEM_IDS = [
  "local-tools",
  "local-credentials",
  "cloudflare-zone",
  "dns-records-parity",
  "dns-nameservers",
  "live-domain-ghost",
  "cloudflare-worker",
  "github-machine-account",
  "github-secret-scanning",
  "workers-builds",
  "github-ci-workflow",
  "github-codeowners",
  "github-major-label",
  "github-main-protection",
  "pipeline-secrets",
  "review-address",
  "review-address-noindex",
  "web-analytics",
];

// Single-section extractor (distinct from extractSections below), matching
// tests/unit/setup/docs-dns.test.ts's helper of the same purpose — used for
// the two edge-case content checks below, which each target one section.
function extractSection(markdown: string, id: string): string {
  const pattern = new RegExp(`^##\\s+.*\\{#${id}\\}\\s*$`, "m");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const start = match.index;
  const rest = markdown.slice(start + match[0].length);
  const nextHeading = /^##\s+/m.exec(rest);
  return rest.slice(0, nextHeading ? nextHeading.index : undefined);
}

function extractSections(markdown: string): { id: string; body: string }[] {
  const headingPattern = /^##\s+.*\{#([a-z0-9-]+)\}\s*$/gm;
  const matches = [...markdown.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? markdown.length) : markdown.length;
    return { id: match[1], body: markdown.slice(start, end) };
  });
}

describe("docs/setup.md structure", () => {
  it("has exactly 18 item sections whose anchors are the spec's fixed item IDs in step order", () => {
    const sections = extractSections(contents);
    expect(sections.map((s) => s.id)).toEqual(ITEM_IDS);
  });

  it.each(ITEM_IDS)("section %s has the three labelled parts in order, plus principle and secrets", (id) => {
    const sections = extractSections(contents);
    const section = sections.find((s) => s.id === id);
    expect(section, `missing section for ${id}`).toBeDefined();
    const body = section!.body;

    const whatIndex = body.indexOf("What it is for");
    const whereIndex = body.indexOf("Where to do it");
    const howIndex = body.indexOf("How it will be confirmed");
    const principleIndex = body.search(/Constitution principle/i);
    const secretsIndex = body.indexOf("Secrets");

    for (const [label, idx] of [
      ["What it is for", whatIndex],
      ["Where to do it", whereIndex],
      ["How it will be confirmed", howIndex],
      ["Constitution principle", principleIndex],
      ["Secrets", secretsIndex],
    ] as const) {
      expect(idx, `${id} is missing labelled part "${label}"`).toBeGreaterThanOrEqual(0);
    }

    expect(whatIndex).toBeLessThan(whereIndex);
    expect(whereIndex).toBeLessThan(howIndex);
  });
});

// spec.md Edge Cases: "Sole maintainer approval" and "Temporary address
// exposed to search engines" (T140, FR-028 partial).
describe("docs/setup.md edge-case content", () => {
  it("github-machine-account explains that Don's approval does not count on a pull request he authored, and that it must be reopened from drc-agents", () => {
    const section = extractSection(contents, "github-machine-account").toLowerCase();
    expect(section).toMatch(/does not count/);
    expect(section).toContain("authored");
    expect(section).toMatch(/reopen/);
    expect(section).toContain("drc-agents");
  });

  it("review-address-noindex tells Don how to ask search engines to remove already-indexed pages, and never to block crawling with robots.txt", () => {
    const section = extractSection(contents, "review-address-noindex").toLowerCase();
    expect(section).toMatch(/search console|removal tool|request.*removal|remove.*already indexed/);
    expect(section).toContain("robots.txt");
    expect(section).toMatch(/never block crawling|must not.*block crawling|do not block crawling/);
  });
});
