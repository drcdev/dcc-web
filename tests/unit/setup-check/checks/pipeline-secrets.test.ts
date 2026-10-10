import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/pipeline-secrets.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };

function githubApi(secrets: unknown, variables: unknown) {
  return vi.fn(async (path: string) => {
    if (path.endsWith("/actions/secrets")) return secrets;
    if (path.endsWith("/actions/variables")) return variables;
    throw new Error(`unexpected path: ${path}`);
  }) as never;
}

describe("checks/pipeline-secrets", () => {
  it("is complete when there are no GitHub Actions secrets or variables (the manifest expects none)", async () => {
    const secrets = loadFixture("github", "actions-secrets-empty");
    const variables = loadFixture("github", "actions-variables-empty");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: githubApi(secrets, variables) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 13 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#pipeline-secrets");
  });

  it("is missing when an undocumented secret exists", async () => {
    const variables = loadFixture("github", "actions-variables-empty");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: githubApi({ total_count: 1, secrets: [{ name: "SOME_UNDOCUMENTED_SECRET" }] }, variables),
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain("extra secret: SOME_UNDOCUMENTED_SECRET");
  });

  it("is missing when an undocumented variable exists", async () => {
    const secrets = loadFixture("github", "actions-secrets-empty");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: githubApi(secrets, { total_count: 1, variables: [{ name: "SOME_UNDOCUMENTED_VAR" }] }),
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.details).toContain("extra variable: SOME_UNDOCUMENTED_VAR");
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
