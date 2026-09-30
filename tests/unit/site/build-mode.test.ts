// Which builds include draft posts (data-model.md "BuildMode"; research R3;
// FR-032, FR-046). Production is exactly a Cloudflare Workers Builds build of
// main; anything that cannot be told apart from it counts as production.
import { describe, expect, it } from "vitest";
import { includeDrafts } from "../../../src/lib/build-mode.ts";

describe("includeDrafts", () => {
  it("includes drafts when there is no Workers Builds environment (local, dev, tests, GitHub Actions)", () => {
    expect(includeDrafts({})).toBe(true);
    expect(includeDrafts({ WORKERS_CI_BRANCH: "main" })).toBe(true);
  });

  it("leaves drafts out of a Workers Builds build of main", () => {
    expect(includeDrafts({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" })).toBe(false);
  });

  it.each([undefined, "", "   "])(
    "fails safe: leaves drafts out when Workers Builds gives no branch (%j) (FR-046)",
    (branch) => {
      expect(includeDrafts({ WORKERS_CI: "1", WORKERS_CI_BRANCH: branch })).toBe(false);
      expect(includeDrafts({ WORKERS_CI: "1" })).toBe(false);
    },
  );

  it.each(["008-blog", "feature/x", "Main", "main-2"])("includes drafts on the preview branch %s", (branch) => {
    expect(includeDrafts({ WORKERS_CI: "1", WORKERS_CI_BRANCH: branch })).toBe(true);
  });

  it.each(["0", "true", "", "yes"])("includes drafts when WORKERS_CI is %j, not 1", (value) => {
    expect(includeDrafts({ WORKERS_CI: value, WORKERS_CI_BRANCH: "main" })).toBe(true);
  });
});
