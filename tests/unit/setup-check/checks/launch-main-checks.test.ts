import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/launch-main-checks.ts";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };

function ctxWith(fixture: string) {
  const api = vi.fn(async () => loadFixture("github", fixture)) as never;
  return { ctx: fakeProviderContext({ fs: { readJson: (() => CONFIG) as never }, github: { api } }), api };
}

describe("checks/launch-main-checks", () => {
  it("is complete when the newest verify run on main succeeded", async () => {
    const { ctx, api } = ctxWith("check-runs-verify-success");
    const result = await check(ctx);
    expect(result.status).toBe("complete");
    expect(result.id).toBe("launch-main-checks");
    expect(result.step).toBe(`Step 27 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#launch-main-checks");
    expect(api).toHaveBeenCalledWith(
      expect.stringContaining("repos/drcdev/dcc-web/commits/main/check-runs?check_name=verify"),
    );
  });

  it("is pending while the newest run is in progress", async () => {
    const { ctx } = ctxWith("check-runs-verify-in-progress");
    const result = await check(ctx);
    expect(result.status).toBe("pending");
    expect(result.nextAction).toMatch(/run the check again/i);
  });

  it("is missing with the run URL for any other conclusion", async () => {
    const { ctx } = ctxWith("check-runs-verify-failure");
    const result = await check(ctx);
    expect(result.status).toBe("missing");
    expect(result.summary).toContain("failure");
    expect([result.summary, ...result.details, result.nextAction].join("\n")).toContain(
      "https://github.com/drcdev/dcc-web/actions/runs/202/job/4",
    );
  });

  it("is could-not-check when there is no run", async () => {
    const { ctx } = ctxWith("check-runs-verify-empty");
    const result = await check(ctx);
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/no verify run/i);
  });

  it("is could-not-check when the read failed", async () => {
    const ctx = fakeProviderContext({
      fs: { readJson: (() => CONFIG) as never },
      github: {
        api: async () => {
          throw new ProviderAccessError("gh api access denied (401/403)");
        },
      },
    });
    const result = await check(ctx);
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/401|403/);
  });
});
