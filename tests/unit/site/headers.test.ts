// public/_headers (contracts/indexing-and-origin.md "HTTP header (by host)"; contracts/http-responses.md;
// research R8; FR-010d, FR-019, FR-024, FR-024c): the security headers on every path, and the
// X-Robots-Tag: noindex only on the hosts that are not the live domain. Invariants only: a value
// or a rule added on purpose is a reviewed config edit, not a test edit.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { headerRules as rules, headersPath } from "../../helpers/headers";

const robotsPath = fileURLToPath(new URL("../../../public/robots.txt", import.meta.url));

const starRule = () => rules().get("/*") ?? new Map<string, string>();

const WORKERS_DEV_RULE = "https://:worker.:subdomain.workers.dev/*";
const ASTRO_RULE = "/_astro/*";
const QUESTION_SOURCE_RULE = "/writing/*/question-source.json";
const SVG_RULE = "/_astro/*.svg";
const publicAstroPath = fileURLToPath(new URL("../../../public/_astro", import.meta.url));

describe("public/_headers", () => {
  // Issue #95: an SVG opened directly is a document, and the page's meta policy does not reach
  // it. Overlapping _headers rules join the same header with a comma, so the browser enforces
  // both this policy and the /* policy. The inline <style> and the data: Inter faces are what
  // the diagrams need.
  it("keeps the SVG policy minimal", () => {
    const csp = rules().get(SVG_RULE)?.get("content-security-policy") ?? "";
    const directives = csp.split(";").map((d) => d.trim());
    expect(directives).toContain("default-src 'none'");
    expect(directives).toContain("sandbox");
    expect(csp).not.toMatch(/script-src|unsafe-eval|allow-|https:|'self'/);
  });

  // F12, FR-015: issue #74 widened this from the font files to every content-hashed file Astro
  // emits under /_astro/. One rule only, because overlapping _headers rules join the same
  // header with a comma. Nothing else sets Cache-Control.
  it("sets an immutable Cache-Control on /_astro/*", () => {
    expect(rules().get(ASTRO_RULE)?.get("cache-control")).toContain("immutable");
  });

  it("sets Cache-Control on no other rule", () => {
    for (const [path, rule] of rules()) {
      if (path !== ASTRO_RULE) expect(rule.has("cache-control"), path).toBe(false);
    }
  });

  // Files in public/ are copied as-is and never renamed with a hash, so an unhashed file
  // under /_astro/ could only come from here and would be cached for a year.
  it("public/ has no _astro directory, so only Astro's hashed build output is served under /_astro/", () => {
    expect(existsSync(publicAstroPath)).toBe(false);
  });

  it("does not set X-Robots-Tag on /* (the live domain is indexable, FR-010d)", () => {
    expect(starRule().has("x-robots-tag")).toBe(false);
  });

  // specs/022 T023: the per-post source file the questions API reads is not for search engines.
  it("sets X-Robots-Tag: noindex on every host rule other than the live domain, and on the question source files", () => {
    const targets = [...rules().keys()].filter((path) => path.startsWith("https://") || path === QUESTION_SOURCE_RULE);
    expect(targets).toContain(WORKERS_DEV_RULE);
    expect(targets).toContain(QUESTION_SOURCE_RULE);
    for (const path of targets) expect(rules().get(path)?.get("x-robots-tag"), path).toBe("noindex");
  });

  // The security headers on every path (contracts/http-responses.md "Headers on every
  // response"; research R8; FR-024, FR-024c). Presence only: a value is a reviewed config edit.
  it.each([
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Frame-Options",
    "Cross-Origin-Opener-Policy",
    "Strict-Transport-Security",
  ])("sets %s on /*", (name) => {
    expect(starRule().get(name.toLowerCase()), name).toBeTruthy();
  });

  // A security invariant (#93, FR-010d reopened once Ghost was retired), like "no 'unsafe-inline'":
  // the policy must cover subdomains. max-age and preload are reviewed config edits, not asserted.
  it("HSTS on /* covers subdomains (#93)", () => {
    const directives = (starRule().get("strict-transport-security") ?? "")
      .split(";")
      .map((d) => d.trim().toLowerCase());
    expect(directives).toContain("includesubdomains");
  });

  it("never sets a cookie", () => {
    const contents = readFileSync(headersPath, "utf-8");
    expect(contents.toLowerCase()).not.toContain("set-cookie");
  });

  it("keeps the header-only CSP free of script and style sources", () => {
    // A header default-src/script-src would be enforced alongside the page's
    // meta policy and block the hashed inline scripts (research R8). The SVG rule's style-src
    // applies only to SVG documents.
    const csp = starRule().get("content-security-policy") ?? "";
    expect(csp).not.toMatch(/default-src|script-src|style-src|unsafe-/);
  });

  it("never sets no-transform", () => {
    const contents = readFileSync(headersPath, "utf-8");
    expect(contents.toLowerCase()).not.toContain("no-transform");
  });
});

// FR-020 regression guard: the X-Robots-Tag: noindex on previews must never
// be hidden from crawlers by a robots.txt crawl block, per
// docs/setup.md#preview-noindex's "never block crawling with
// robots.txt" rule (T146).
describe("public/robots.txt", () => {
  it("either does not exist, or contains no Disallow rule", () => {
    if (!existsSync(robotsPath)) return;
    const contents = readFileSync(robotsPath, "utf-8");
    expect(contents.toLowerCase()).not.toMatch(/^disallow:/m);
  });
});
