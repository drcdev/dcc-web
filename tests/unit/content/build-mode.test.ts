// Unit tests for isProductionBuild (data-model.md "Derived: published projects and order").
// It is the other side of includeDrafts() (tests/unit/site/build-mode.test.ts), so the
// fail-safe rule holds here too: a Workers Builds build with no readable branch is production.
import { describe, expect, it } from "vitest";
import { includeDrafts, isProductionBuild } from "../../../src/lib/build-mode.ts";

describe("isProductionBuild", () => {
  it("is true only on the Workers CI build of main", () => {
    expect(isProductionBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" })).toBe(true);
  });

  it.each([undefined, "", "   "])(
    "fails safe: is true when Workers Builds gives no branch (%j), so drafts stay out",
    (branch) => {
      expect(isProductionBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: branch })).toBe(true);
    },
  );

  it.each([
    ["locally", {}],
    ["on another branch", { WORKERS_CI: "1", WORKERS_CI_BRANCH: "009-portfolio" }],
    ["outside Workers CI", { WORKERS_CI_BRANCH: "main" }],
    ["with WORKERS_CI not 1", { WORKERS_CI: "0", WORKERS_CI_BRANCH: "main" }],
    ["with a different case", { WORKERS_CI: "1", WORKERS_CI_BRANCH: "Main" }],
  ])("is false %s", (_name, env) => {
    expect(isProductionBuild(env)).toBe(false);
  });

  it.each([
    {},
    { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
    { WORKERS_CI: "1" },
    { WORKERS_CI: "1", WORKERS_CI_BRANCH: "009-portfolio" },
    { WORKERS_CI: "0", WORKERS_CI_BRANCH: "main" },
  ])("is always the opposite of includeDrafts for %j", (env) => {
    expect(isProductionBuild(env)).toBe(!includeDrafts(env));
  });
});
