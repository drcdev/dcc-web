// Unit tests for scripts/deploy/production.ts (specs/007-contact-form/contracts/worker-config.md).
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { productionDeploySteps } from "../../../scripts/deploy/production.ts";

describe("productionDeploySteps", () => {
  it("applies production migrations first, then deploys", () => {
    expect(productionDeploySteps({ WORKERS_CI_BRANCH: "main" })).toEqual([
      ["d1", "migrations", "apply", "dcc-web-contact", "--remote"],
      ["deploy"],
    ]);
  });

  it("never selects the preview environment", () => {
    const flat = productionDeploySteps({ WORKERS_CI_BRANCH: "main" }).flat();
    expect(flat).not.toContain("--env");
    expect(flat).not.toContain("dcc-web-contact-preview");
  });

  it("accepts WRANGLER_CI_OVERRIDE_NAME when it is dcc-web", () => {
    expect(() =>
      productionDeploySteps({ WORKERS_CI_BRANCH: "main", WRANGLER_CI_OVERRIDE_NAME: "dcc-web" }),
    ).not.toThrow();
  });

  it("refuses when WRANGLER_CI_OVERRIDE_NAME names another Worker", () => {
    expect(() =>
      productionDeploySteps({
        WORKERS_CI_BRANCH: "main",
        WRANGLER_CI_OVERRIDE_NAME: "dcc-web-preview",
      }),
    ).toThrow(/WRANGLER_CI_OVERRIDE_NAME/);
  });

  it("refuses unless the branch is main", () => {
    expect(() => productionDeploySteps({ WORKERS_CI_BRANCH: "feature-x" })).toThrow(/main/);
    expect(() => productionDeploySteps({})).toThrow(/main/);
  });
});

describe("scripts/deploy/production.ts run as a child process", () => {
  const scriptPath = fileURLToPath(new URL("../../../scripts/deploy/production.ts", import.meta.url));

  it("exits non-zero before running anything and prints no environment values", () => {
    const secretLikeValue = "should-never-be-printed-zzq9";
    const result = spawnSync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        WORKERS_CI_BRANCH: "feature-x",
        WRANGLER_CI_OVERRIDE_NAME: secretLikeValue,
      },
      encoding: "utf-8",
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout ?? ""}${result.stderr ?? ""}`).not.toContain(secretLikeValue);
  });
});
