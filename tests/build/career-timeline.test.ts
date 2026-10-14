// Wiring runs for the career timeline (specs/041-career-timeline/contracts/build-errors.md "Wiring").
// The schema rules are unit-tested (tests/unit/content/career-schema.test.ts); this run proves the
// collection is registered in src/content.config.ts and Astro names the step file and field.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

describe("career timeline wiring", () => {
  it("T01: sync fails on a step with no scope, naming the file and the field", async () => {
    result = await buildFixtureSite([], { mode: "sync", career: ["broken/missing-scope.yaml"] });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("missing-scope.yaml");
    expect(result.message).toContain("scope");
  });

  it("T09: the About page build fails on a latest step that does not end present, naming the file", async () => {
    // Only the real build shows that checkCareer() runs from the page (its one build run).
    result = await buildFixtureSite([], { career: ["broken/latest-not-present.yaml"] });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("latest-not-present.yaml");
    expect(result.message).toContain("end must be present");
  });

  it("a site with no step files syncs", async () => {
    result = await buildFixtureSite([], { mode: "sync" });
    expect(result.ok, result.message).toBe(true);
  });
});
