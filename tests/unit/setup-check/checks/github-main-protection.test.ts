import { readFileSync } from "node:fs";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/github-main-protection.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };
const RULESET_SUMMARY = [{ id: 1, name: "main-protection", target: "branch", enforcement: "active" }];
const EXPECTED = JSON.parse(readFileSync("setup/github-ruleset.json", "utf8"));

/** fs.readJson fake: the committed ruleset or the config, by path. */
const readJson = ((path: string) => (path === "setup/github-ruleset.json" ? EXPECTED : CONFIG)) as never;

type Rule = { type: string; parameters: Record<string, unknown> };

function githubApi(list: unknown, full?: unknown) {
  return vi.fn(async (path: string) => {
    if (path.endsWith("/rulesets")) return list;
    if (path.endsWith("/rulesets/1")) return full;
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

/** The full live ruleset, with one rule's parameters adjusted. */
function liveWith(ruleType: string, changes: Record<string, unknown>) {
  const full = structuredClone(loadFixture("github", "ruleset-full")) as { rules: Rule[] };
  const rule = full.rules.find((r) => r.type === ruleType)!;
  Object.assign(rule.parameters, changes);
  return full;
}

async function gapsFor(full: unknown): Promise<string[]> {
  const ctx = fakeProviderContext({ fs: { readJson }, github: { api: githubApi(RULESET_SUMMARY, full) } });
  const result = await check(ctx);
  return result.status === "complete" ? [] : result.details;
}

describe("checks/github-main-protection", () => {
  it("is missing naming every gap when no ruleset protects main", async () => {
    const list = loadFixture("github", "ruleset-none");
    const ctx = fakeProviderContext({
      fs: { readJson },
      github: { api: githubApi(list) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain("protection active on main");
    expect(result.details).toContain("pull request required");
    expect(result.details).toContain("required check verify");
    expect(result.details).toContain("force-pushes blocked");
    expect(result.details).toContain("deletion blocked");
  });

  it("is missing naming exactly the gaps for a partially configured ruleset", async () => {
    const full = loadFixture("github", "ruleset-partial");
    const ctx = fakeProviderContext({
      fs: { readJson },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toEqual([
      "one approving review required",
      "required check verify",
      "branch must be up to date before merging",
      "force-pushes blocked",
      "no bypass actors",
    ]);
  });

  it("is complete when the active ruleset matches setup/github-ruleset.json in full", async () => {
    const full = loadFixture("github", "ruleset-full");
    const ctx = fakeProviderContext({
      fs: { readJson },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 14 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#github-main-protection");
  });

  it("names stale approvals that are not dismissed on new commits", async () => {
    const gaps = await gapsFor(liveWith("pull_request", { dismiss_stale_reviews_on_push: false }));
    expect(gaps).toEqual(["stale approvals dismissed on new commits"]);
  });

  it("names a review count below the committed one", async () => {
    const gaps = await gapsFor(liveWith("pull_request", { required_approving_review_count: 0 }));
    expect(gaps).toEqual(["one approving review required"]);
  });

  it("names a merge-method difference", async () => {
    const gaps = await gapsFor(liveWith("pull_request", { allowed_merge_methods: ["merge", "squash"] }));
    expect(gaps).toEqual(["merge commits only"]);
  });

  it("names any other differing pull-request parameter by key", async () => {
    const gaps = await gapsFor(liveWith("pull_request", { require_code_owner_review: true }));
    expect(gaps).toEqual(["pull request setting require_code_owner_review differs"]);
  });

  it("names a live required check that is not in the committed file", async () => {
    const full = liveWith("required_status_checks", {
      required_status_checks: [{ context: "verify", integration_id: 15368 }, { context: "major-change-approval" }],
    });
    expect(await gapsFor(full)).toEqual(["unexpected required check major-change-approval"]);
  });

  it("names verify when it is not pinned to the committed integration", async () => {
    const without = liveWith("required_status_checks", { required_status_checks: [{ context: "verify" }] });
    expect(await gapsFor(without)).toEqual(["required check verify"]);
    const other = liveWith("required_status_checks", {
      required_status_checks: [{ context: "verify", integration_id: 1 }],
    });
    expect(await gapsFor(other)).toEqual(["required check verify"]);
  });

  it("reports no bypass gap when bypass_actors is absent from the response", async () => {
    const full = structuredClone(loadFixture("github", "ruleset-full")) as Record<string, unknown>;
    delete full.bypass_actors;
    expect(await gapsFor(full)).toEqual([]);
  });

  it("is missing with 'protection active on main' when the ruleset's conditions do not cover refs/heads/main", async () => {
    // Every other rule is fully compliant, so this isolates the branch coverage gap.
    const full = loadFixture("github", "ruleset-wrong-branch");
    const ctx = fakeProviderContext({
      fs: { readJson },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toEqual(["protection active on main"]);
  });

  it("is missing with 'protection active on main' when the ruleset's conditions explicitly exclude refs/heads/main", async () => {
    const full = loadFixture("github", "ruleset-excludes-main");
    const ctx = fakeProviderContext({
      fs: { readJson },
      github: { api: githubApi(RULESET_SUMMARY, full) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain("protection active on main");
  });

  it("is could-not-check when the gh api call fails", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson },
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
