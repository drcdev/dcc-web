import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const headersPath = fileURLToPath(new URL("../../../public/_headers", import.meta.url));
const robotsPath = fileURLToPath(new URL("../../../public/robots.txt", import.meta.url));


/** Header name (lowercase) → value for the `/*` rule. */
function starRule(): Map<string, string> {
  const lines = readFileSync(headersPath, "utf-8").split("\n");
  const start = lines.findIndex((line) => line.trim() === "/*");
  expect(start).toBeGreaterThanOrEqual(0);
  const rule = new Map<string, string>();
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) break;
    const colon = line.indexOf(":");
    rule.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }
  return rule;
}

describe("public/_headers", () => {
  it("sets X-Robots-Tag: noindex on /*", () => {
    const contents = readFileSync(headersPath, "utf-8");
    const lines = contents.split("\n").map((line) => line.trim());
    const starIndex = lines.findIndex((line) => line === "/*");
    expect(starIndex).toBeGreaterThanOrEqual(0);

    const followingLines = lines.slice(starIndex + 1).filter((line) => line.length > 0);
    const robotsLine = followingLines.find((line) =>
      line.toLowerCase().startsWith("x-robots-tag:"),
    );
    expect(robotsLine).toBeDefined();
    expect(robotsLine?.toLowerCase()).toContain("noindex");
  });

  // The full FR-024 header set on every path (contracts/http-responses.md
  // "Headers on every response"; research R8; FR-019, FR-024, FR-024c).
  it.each([
    ["X-Robots-Tag", "noindex"],
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

  it("sets exactly the current header set on /* (no header added or removed; blog guard, FR-053)", () => {
    expect([...starRule().keys()].sort()).toEqual(
      [
        "content-security-policy",
        "cross-origin-opener-policy",
        "permissions-policy",
        "referrer-policy",
        "strict-transport-security",
        "x-content-type-options",
        "x-frame-options",
        "x-robots-tag",
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

// FR-020 regression guard: public/_headers' X-Robots-Tag: noindex must never
// be hidden from crawlers by a robots.txt crawl block, per
// docs/setup.md#review-address-noindex's "never block crawling with
// robots.txt" rule (T146).
describe("public/robots.txt", () => {
  it("either does not exist, or contains no Disallow rule", () => {
    if (!existsSync(robotsPath)) return;
    const contents = readFileSync(robotsPath, "utf-8");
    expect(contents.toLowerCase()).not.toMatch(/^disallow:/m);
  });
});
