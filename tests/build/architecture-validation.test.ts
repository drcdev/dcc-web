// Wiring run for the architecture part rows of contracts/part-files.md. The logic of P03-P07 is
// asserted in tests/unit/content/architecture-source.test.ts; this proves Astro's loader calls it
// on real files and that the message names the part file and the path. `sync` loads and validates
// the content collections. One broken file per run, because a run stops at the first error.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

describe("architecture part wiring (sync)", () => {
  it("P04: generateId runs assertPartSource and names the file and the missing path", async () => {
    result = await buildFixtureSite([], { mode: "sync", architecture: ["broken/missing-source.md"] });
    expect(result.ok, "the sync should fail").toBe(false);
    expect(result.message).toContain("Architecture part file");
    expect(result.message).toContain("missing-source.md");
    expect(result.message).toContain("worker/src/does-not-exist.ts");
    expect(result.message).toContain("does not exist in the repository");
  });

  it("the repository's real part files pass in a fixture site", async () => {
    result = await buildFixtureSite([], { mode: "sync" });
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
  });
});
