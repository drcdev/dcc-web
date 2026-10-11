// Wiring runs for the Now rows of specs/040-home-now-start-here/contracts/build-errors.md. The rules
// are unit-tested (tests/unit/content/now-schema.test.ts, now-body.test.ts); these runs prove the real
// build runs them and renders the section. Each run holds one broken file, because a build stops at the
// first error. Fixtures live in tests/fixtures/now/ and tests/fixtures/reading-paths/broken/.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

describe("Now wiring", () => {
  it("builds a valid Now entry and the home page holds the Now section", async () => {
    result = await buildFixtureSite([], { mode: "build", now: "now.md" });
    expect(result.ok, result.message).toBe(true);
    const home = result.read("index.html");
    expect(home).toContain("data-now");
    expect(home).toMatch(/Updated\s*<time datetime="2026-01-15"[^>]*>January 15, 2026<\/time>/);
  });

  it("N03: the build fails on a future-dated Now", async () => {
    result = await buildFixtureSite([], { mode: "build", now: "../reading-paths/broken/future-now/now.md" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("is in the future");
    expect(result.message).toContain("now.md");
  });

  it("N06: the build fails on a Now body with no contact link", async () => {
    result = await buildFixtureSite([], { mode: "build", now: "../reading-paths/broken/now-no-contact/now.md" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("must link to");
  });

  it("N07: the build fails when there are two Now files", async () => {
    result = await buildFixtureSite([], {
      mode: "build",
      now: "now.md",
      write: { "src/content/now/now-extra.md": readFileSync(new URL("../fixtures/now/now.md", import.meta.url), "utf-8") },
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("there must be exactly one Now file, now.md.");
  });

  it("N07: the build fails when there is no Now file", async () => {
    result = await buildFixtureSite([], { mode: "build", now: false });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("there must be exactly one Now file, now.md.");
  });
});
