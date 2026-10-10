// Which builds are indexable (contracts/indexing-and-origin.md; FR-010d, FR-019). Exactly a
// Cloudflare Workers Builds build of main; anything unclear fails toward noindex.
import { describe, expect, it } from "vitest";
import { isIndexableBuild } from "../../../src/lib/build-mode.ts";

describe("isIndexableBuild", () => {
  it("is true for a Workers Builds build of main", () => {
    expect(isIndexableBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" })).toBe(true);
    expect(isIndexableBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: " main " })).toBe(true);
  });

  it("is false with no Workers Builds environment (local, dev, tests, GitHub Actions)", () => {
    expect(isIndexableBuild({})).toBe(false);
    expect(isIndexableBuild({ WORKERS_CI_BRANCH: "main" })).toBe(false);
  });

  it.each([undefined, "", "   "])("fails toward noindex when Workers Builds gives no branch (%j)", (branch) => {
    expect(isIndexableBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: branch })).toBe(false);
    expect(isIndexableBuild({ WORKERS_CI: "1" })).toBe(false);
  });

  it.each(["042-sample-feature", "feature/x", "Main", "main-2"])("is false on the preview branch %s", (branch) => {
    expect(isIndexableBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: branch })).toBe(false);
  });

  it.each(["0", "true", "", "yes"])("is false when WORKERS_CI is %j, not 1", (value) => {
    expect(isIndexableBuild({ WORKERS_CI: value, WORKERS_CI_BRANCH: "main" })).toBe(false);
  });
});
