import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/github-main-protection.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };
const RULESET_SUMMARY = [{ id: 1, name: "main-protection", target: "branch", enforcement: "active" }];

function githubApi(list: unknown, full?: unknown) {
  return vi.fn(async (path: string) => {
    if (path.endsWith("/rulesets")) return list;
    if (path.endsWith("/rulesets/1")) return full;
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

describe("checks/github-main-protection", () => {
  it("is missing naming every closed-list rule when no ruleset protects main", async () => {
    const list = loadFixture("github", "ruleset-none");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(list) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain("protection active on main");
    expect(result.details).toContain("pull request required");
    expect(result.details).toContain("required check verify");
    expect(result.details).toContain("required check major-change-approval");
    expect(result.details).toContain("force-pushes blocked");
    expect(result.details).toContain("deletion blocked");
  });

  it("is missing naming exactly the gaps for a partially configured ruleset", async () => {
    const full = loadFixture("github", "ruleset-partial");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toEqual([
      "code-owner review required",
      "required check verify",
      "required check major-change-approval",
      "branch must be up to date before merging",
      "force-pushes blocked",
      "no bypass actors",
    ]);
  });

  it("is complete when the active ruleset matches setup/github-ruleset.json in full", async () => {
    const full = loadFixture("github", "ruleset-full");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 14 of 18");
    expect(result.docs).toBe("docs/setup.md#github-main-protection");
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
  });
});
