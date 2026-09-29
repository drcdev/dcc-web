import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/workers-builds.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };

function githubApi(routes: { mainRuns?: unknown; prs?: unknown; prRuns?: unknown }) {
  return vi.fn(async (path: string) => {
    if (path.includes("/commits/main/check-runs")) return routes.mainRuns;
    if (path.startsWith("repos/drcdev/dcc-web/pulls")) return routes.prs ?? [];
    if (path.includes("/check-runs")) return routes.prRuns;
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

describe("checks/workers-builds", () => {
  it("is missing when no Workers Builds run exists on the latest main commit", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ mainRuns: { check_runs: [] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.step).toBe("Step 10 of 18");
    expect(result.docs).toBe("docs/setup.md#workers-builds");
  });

  it("is pending while the main commit's Workers Builds run is queued or running", async () => {
    const mainRuns = loadFixture("github", "check-runs-workers-builds-queued");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ mainRuns }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("pending");
    expect(result.nextAction).toMatch(/wait/i);
  });

  it("is missing when the main commit's Workers Builds run failed", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: githubApi({
          mainRuns: { check_runs: [{ name: "Workers Builds: dcc-web", status: "completed", conclusion: "failure" }] },
        }),
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/did not succeed/i);
  });

  it("is complete when main succeeded and there is no open pull request", async () => {
    const mainRuns = loadFixture("github", "check-runs-workers-builds-success");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ mainRuns, prs: [] }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.summary).toMatch(/no open pull request/i);
  });

  it("is complete when the open pull request has a successful preview build, regardless of who authored it", async () => {
    const mainRuns = loadFixture("github", "check-runs-workers-builds-success");
    const pr = loadFixture("github", "pr-open-authored-by-don");
    const prRuns = loadFixture("github", "check-runs-workers-builds-success");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ mainRuns, prs: [pr], prRuns }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.summary).toMatch(/preview url/i);
  });

  it("is missing when the open pull request's latest commit has no Workers Builds run yet", async () => {
    const mainRuns = loadFixture("github", "check-runs-workers-builds-success");
    const pr = loadFixture("github", "pr-open-authored-by-bot");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ mainRuns, prs: [pr], prRuns: { check_runs: [] } }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/pull request/i);
  });

  it("is pending when the open pull request's preview build is still running", async () => {
    const mainRuns = loadFixture("github", "check-runs-workers-builds-success");
    const pr = loadFixture("github", "pr-open-authored-by-bot");
    const prRuns = loadFixture("github", "check-runs-workers-builds-queued");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi({ mainRuns, prs: [pr], prRuns }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("pending");
  });

  it("is could-not-check when the gh api call fails", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: async () => {
          throw new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/signed in/i);
  });
});
