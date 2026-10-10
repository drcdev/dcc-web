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
  "mail-records",
  "cloudflare-worker",
  "github-machine-account",
  "github-secret-scanning",
  "workers-builds",
  "github-ci-workflow",
  "github-codeowners",
  "github-main-protection",
  "pipeline-secrets",
  "preview-noindex",
  "web-analytics",
  "contact-bindings",
  "contact-email",
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
  it("has exactly 17 item sections whose anchors are the spec's fixed item IDs in step order", () => {
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

  it("preview-noindex tells Don how to ask search engines to remove already-indexed pages, and never to block crawling with robots.txt", () => {
    const section = extractSection(contents, "preview-noindex").toLowerCase();
    expect(section).toMatch(/search console|removal tool|request.*removal|remove.*already indexed/);
    expect(section).toContain("robots.txt");
    expect(section).toMatch(/never block crawling|must not.*block crawling|do not block crawling/);
  });
});

describe("docs/setup.md contact-form part", () => {
  const registryLength = ITEM_IDS.length;

  it("the intro counts items from the registry length and no longer says 18", () => {
    const intro = contents.slice(0, contents.indexOf("## 1."));
    expect(intro).toContain(`${registryLength}-item registry`);
    expect(intro).toContain(`of the ${registryLength} items`);
    expect(intro).not.toMatch(/\b18-item|\b18 items/);
  });

  it("has a Contact form part heading before the first contact section", () => {
    const part = contents.indexOf("# Contact form");
    expect(part).toBeGreaterThan(contents.indexOf("{#web-analytics}"));
    expect(part).toBeLessThan(contents.indexOf("{#contact-bindings}"));
  });

  it("item 2 lists the D1, Workers Builds Configuration and Turnstile Sites read permissions", () => {
    const s = extractSection(contents, "local-credentials");
    expect(s).toMatch(/D1: Read/);
    expect(s).toMatch(/Workers Builds Configuration: Read/);
    expect(s).toMatch(/Turnstile Sites: Read/);
  });

  it("the workers-builds item describes the dcc-web-preview Worker's own Workers Builds connection", () => {
    const s = extractSection(contents, "workers-builds");
    expect(s).toContain("dcc-web-preview");
    expect(s).toContain("pnpm run deploy:preview");
    expect(s).toContain("pnpm run deploy:production");
    expect(s).not.toContain("only the non-production branch command changes");
  });

  it("the contact bindings item restates the region, says it cannot be changed, and shows the exact commands", () => {
    const s = extractSection(contents, "contact-bindings");
    expect(s).toContain("Western North America");
    expect(s).toContain("`wnam`");
    expect(s).toMatch(/cannot be changed/i);
    expect(s).toContain("pnpm exec wrangler d1 create dcc-web --location wnam");
    expect(s).toContain("pnpm exec wrangler d1 create dcc-web-preview --location wnam");
    expect(s).toContain("pnpm exec wrangler d1 delete");
    expect(s).toContain("usage bucket");
  });

  it("the contact bindings item notes the Workers Builds token may need the Workers AI permission", () => {
    expect(extractSection(contents, "contact-bindings")).toContain("Workers AI");
  });

  it("the contact bindings item gives secret put commands and the replacement rule, and never asks for a value in chat", () => {
    const s = extractSection(contents, "contact-bindings");
    expect(s).toContain("wrangler secret put TURNSTILE_SECRET_KEY");
    expect(s).not.toMatch(/CONTACT_READ_TOKEN|IP_HASH_SALT/);
    expect(s).not.toContain("17 3 * * *");
    expect(s).toContain("--env preview");
    expect(s).toMatch(/replac/i);
    expect(s).toMatch(/never[^.]*chat/i);
  });

  it("the contact email item gives the drc.dev steps, leaves doncoleman.ca DNS alone, names the token permissions and the secret clean-up", () => {
    const s = extractSection(contents, "contact-email");
    expect(contents.indexOf("{#contact-email}")).toBeGreaterThan(contents.indexOf("{#contact-bindings}"));
    expect(s).toContain("drc.dev");
    expect(s).toContain("contact-form@drc.dev");
    expect(s).toContain("contact@doncoleman.ca");
    expect(s).not.toMatch(/mail\.doncoleman\.ca|Subdomains/);
    expect(s).toMatch(/no DNS change on doncoleman\.ca/i);
    expect(s).toContain("Email Routing Addresses: Read");
    expect(s).toContain("Email Routing Rules: Read");
    expect(s).toContain("pnpm setup:check --item contact-email");
    expect(s).toContain("wrangler secret delete CONTACT_READ_TOKEN");
    expect(s).toContain("wrangler secret delete IP_HASH_SALT");
    expect(s).toContain("--env-file /dev/null");
    expect(s).toMatch(/7 days/);
  });

  it("the contact bindings item names the preview and production deploy commands and the site-key variable", () => {
    const s = extractSection(contents, "contact-bindings");
    expect(s).toContain("pnpm run deploy:preview");
    expect(s).toContain("PUBLIC_TURNSTILE_SITE_KEY");
    expect(s).toContain("pnpm run deploy:production");
    expect(s.toLowerCase()).toContain("after");
  });
});
