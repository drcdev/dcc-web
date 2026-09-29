import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const headersPath = fileURLToPath(new URL("../../../public/_headers", import.meta.url));
const robotsPath = fileURLToPath(new URL("../../../public/robots.txt", import.meta.url));

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
