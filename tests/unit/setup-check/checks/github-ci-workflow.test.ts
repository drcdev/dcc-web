import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/github-ci-workflow.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };

function githubApi(routes: { workflows?: unknown; runs?: unknown }) {
  return vi.fn(async (path: string) => {
    if (path.includes("/actions/workflows/ci.yml/runs")) return routes.runs ?? { workflow_runs: [] };
    if (path.includes("/actions/workflows")) return routes.workflows;
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

describe("checks/github-ci-workflow", () => {
  it("is missing when major-change.yml is missing from main", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: githubApi({ workflows: { workflows: [{ path: ".github/workflows/ci.yml", name: "CI" }] } }),
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain(".github/workflows/major-change.yml");
  });

  it("is missing when there is no recorded verify run on main", async () => {
    const workflows = loadFixture("github", "workflows-both-present");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ workflows: { workflows }, runs: { workflow_runs: [] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/no verify run/i);
  });

  it("is missing while the latest verify run on main is still in progress", async () => {
    const workflows = loadFixture("github", "workflows-both-present");
    const run = loadFixture("github", "workflow-run-verify-in-progress");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ workflows: { workflows }, runs: { workflow_runs: [run] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/in progress/i);
  });

  it("is missing when the latest verify run on main failed", async () => {
    const workflows = loadFixture("github", "workflows-both-present");
    const run = loadFixture("github", "workflow-run-verify-failure");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ workflows: { workflows }, runs: { workflow_runs: [run] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/did not succeed/i);
  });

  it("is complete when both workflows exist on main and the latest verify run succeeded", async () => {
    const workflows = loadFixture("github", "workflows-both-present");
    const run = loadFixture("github", "workflow-run-verify-success");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ workflows: { workflows }, runs: { workflow_runs: [run] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 11 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#github-ci-workflow");
  });

  it("is could-not-check when the gh api call fails", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: async () => {
          throw new ProviderAccessError("gh api access denied (401/403); check the signed-in account's permissions");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/401|403/);
  });
});
