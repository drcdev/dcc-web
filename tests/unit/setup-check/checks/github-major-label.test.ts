import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/github-major-label.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };

function githubApi(labels: unknown, settings: unknown) {
  return vi.fn(async (path: string) => {
    if (path.endsWith("/labels")) return labels;
    if (path === "repos/drcdev/dcc-web") return settings;
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

describe("checks/github-major-label", () => {
  it("is complete when the major-change label exists and auto-merge is allowed", async () => {
    const labels = loadFixture("github", "labels-with-major-change");
    const settings = loadFixture("github", "repo-settings-secret-scanning-on"); // allow_auto_merge: true
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(labels, settings) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 13 of 18");
    expect(result.docs).toBe("docs/setup.md#github-major-label");
  });

  it("is missing when the major-change label does not exist", async () => {
    const labels = loadFixture("github", "labels-without-major-change");
    const settings = loadFixture("github", "repo-settings-secret-scanning-on");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(labels, settings) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/label/i);
  });

  it("is missing when auto-merge is not allowed", async () => {
    const labels = loadFixture("github", "labels-with-major-change");
    const settings = loadFixture("github", "repo-settings-no-auto-merge");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(labels, settings) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/auto-merge/i);
  });

  it("does not inspect individual pull requests: an open PR authored by Don has no effect on this item", async () => {
    const labels = loadFixture("github", "labels-with-major-change");
    const settings = loadFixture("github", "repo-settings-secret-scanning-on");
    const api = vi.fn(async (path: string) => {
      if (path.endsWith("/labels")) return labels;
      if (path === "repos/drcdev/dcc-web") return settings;
      // A check that inspected pull requests would call a `pulls` path; fail loudly if it does.
      throw new Error(`unexpected path (must not inspect pull requests): ${path}`);
    });
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: api as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(api).not.toHaveBeenCalledWith(expect.stringContaining("pulls"));
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
  });
});
