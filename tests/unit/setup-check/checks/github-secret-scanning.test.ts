import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/github-secret-scanning.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };

interface RepoSettingsFixture {
  security_and_analysis: {
    secret_scanning: { status: string };
    secret_scanning_push_protection: { status: string };
  };
}

describe("checks/github-secret-scanning", () => {
  it("is complete when both secret scanning and push protection are enabled", async () => {
    const settings = loadFixture<RepoSettingsFixture>("github", "repo-settings-secret-scanning-on");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: (async () => settings) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 9 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#github-secret-scanning");
  });

  it("is missing when secret scanning and push protection are disabled", async () => {
    const settings = loadFixture<RepoSettingsFixture>("github", "repo-settings-secret-scanning-off");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: (async () => settings) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/secret scanning/i);
    expect(result.nextAction).toMatch(/code security/i);
  });

  it("is missing when only push protection is off", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: (async () => ({
          security_and_analysis: {
            secret_scanning: { status: "enabled" },
            secret_scanning_push_protection: { status: "disabled" },
          },
        })) as never,
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/push protection/i);
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
