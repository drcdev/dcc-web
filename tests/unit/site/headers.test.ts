// public/_headers (contracts/indexing-and-origin.md "HTTP header (by host)"; contracts/http-responses.md;
// research R8; FR-010d, FR-019, FR-024, FR-024c): the security headers on every path, and the
// X-Robots-Tag: noindex only on the hosts that are not the live domain.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const headersPath = fileURLToPath(new URL("../../../public/_headers", import.meta.url));
const robotsPath = fileURLToPath(new URL("../../../public/robots.txt", import.meta.url));

/** Header name (lowercase) → value for each rule, keyed by the rule's path or host pattern. */
function rules(): Map<string, Map<string, string>> {
  const result = new Map<string, Map<string, string>>();
  let current: Map<string, string> | undefined;
  for (const line of readFileSync(headersPath, "utf-8").split("\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = new Map();
      result.set(line.trim(), current);
      continue;
    }
    const colon = line.indexOf(":");
    current!.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }
  return result;
}

const starRule = () => rules().get("/*") ?? new Map<string, string>();

const WORKERS_DEV_RULE = "https://:worker.:subdomain.workers.dev/*";
const ASTRO_RULE = "/_astro/*";
const REVIEW_HOST_RULE ="https://new.doncoleman.ca/*";
const publicAstroPath = fileURLToPath(new URL("../../../public/_astro", import.meta.url));

describe("public/_headers", () => {
  it("has exactly four rules, in order: every path, the fingerprinted build files, workers.dev previews and the review host", () => {
    expect([...rules().keys()]).toEqual(["/*", ASTRO_RULE, WORKERS_DEV_RULE, REVIEW_HOST_RULE]);
  });

  // F12, FR-015: issue #74 widened this from the font files to every content-hashed file Astro
  // emits under /_astro/. One rule only, because overlapping _headers rules join the same
  // header with a comma. Nothing else sets Cache-Control.
  it("sets only the immutable year-long Cache-Control on /_astro/*", () => {
    expect([...rules().get(ASTRO_RULE)!.entries()]).toEqual([["cache-control", "public, max-age=31536000, immutable"]]);
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

  it.each([WORKERS_DEV_RULE, REVIEW_HOST_RULE])("sets X-Robots-Tag: noindex, and nothing else, on %s", (host) => {
    const rule = rules().get(host);
    expect(rule).toBeDefined();
    expect([...rule!.entries()]).toEqual([["x-robots-tag", "noindex"]]);
  });

  // The full FR-024 header set on every path (contracts/http-responses.md
  // "Headers on every response"; research R8; FR-024, FR-024c).
  it.each([
    ["Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"],
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"],
    ["X-Frame-Options", "DENY"],
    ["Cross-Origin-Opener-Policy", "same-origin"],
    ["Strict-Transport-Security", "max-age=31536000"],
  ])("sets %s: %s on /*", (name, value) => {
    expect(starRule().get(name.toLowerCase())).toBe(value);
  });

  it("sets exactly the security header set on /* (no header added or removed; blog guard, FR-053)", () => {
    expect([...starRule().keys()].sort()).toEqual(
      [
        "content-security-policy",
        "cross-origin-opener-policy",
        "permissions-policy",
        "referrer-policy",
        "strict-transport-security",
        "x-content-type-options",
        "x-frame-options",
      ].sort(),
    );
  });

  it("never sets a cookie", () => {
    const contents = readFileSync(headersPath, "utf-8");
    expect(contents.toLowerCase()).not.toContain("set-cookie");
  });

  it("keeps the header-only CSP free of script and style sources", () => {
    // A header default-src/script-src would be enforced alongside the page's
    // meta policy and block the hashed inline scripts (research R8).
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
