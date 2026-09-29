import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/github-machine-account.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web", machineAccount: "drc-agents" };

interface PermissionFixture {
  login: string;
  permissions: { admin: boolean; maintain?: boolean; push: boolean; pull: boolean };
}

describe("checks/github-machine-account", () => {
  it("is complete when drc-agents's permission is write (push true, admin false)", async () => {
    const permission = loadFixture<PermissionFixture>("github", "collaborator-permission-write");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: (async () => permission) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe("Step 8 of 18");
    expect(result.docs).toBe("docs/setup.md#github-machine-account");
  });

  it("is missing when drc-agents's permission is admin", async () => {
    const permission = loadFixture<PermissionFixture>("github", "collaborator-permission-admin");
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: { api: (async () => permission) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/admin/i);
    expect(result.nextAction).toMatch(/write|maintain/i);
  });

  it("is missing when drc-agents is not a collaborator yet (404)", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: async () => {
          throw new ProviderAccessError("gh api reported 404 (resource not found or no read access)");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toContain("drc-agents");
    expect(result.nextAction).toMatch(/collaborator/i);
  });

  it("is could-not-check when the gh api call fails for another reason", async () => {
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
