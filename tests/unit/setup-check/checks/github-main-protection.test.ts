import { setupItems } from "../../../../scripts/setup-check/items.ts";
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
    expect(result.details).toContain("one approving review required");
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
      "one approving review required",
      "code-owner review required",
      "required check verify",
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
    expect(result.step).toBe(`Step 13 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#github-main-protection");
  });

  it("is missing with 'protection active on main' when the ruleset's conditions do not cover refs/heads/main", async () => {
    // Every other rule is fully compliant (identical to ruleset-full.json) —
    // only the branch coverage is wrong — so this isolates the new logic
    // added for spec setup item 14's "protection active on main" gap.
    const full = loadFixture("github", "ruleset-wrong-branch");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toEqual(["protection active on main"]);
  });

  it("is missing with 'protection active on main' when the ruleset's conditions explicitly exclude refs/heads/main", async () => {
    const full = loadFixture("github", "ruleset-excludes-main");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain("protection active on main");
  });

  it("is missing with 'required check verify pinned to GitHub Actions' when verify has no app pin", async () => {
    const full = structuredClone(loadFixture("github", "ruleset-full")) as {
      rules: Array<{ type: string; parameters?: { required_status_checks?: Array<Record<string, unknown>> } }>;
    };
    const checks = full.rules.find((r) => r.type === "required_status_checks")?.parameters?.required_status_checks;
    delete checks?.[0]?.integration_id;
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toEqual(["required check verify pinned to GitHub Actions"]);
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
