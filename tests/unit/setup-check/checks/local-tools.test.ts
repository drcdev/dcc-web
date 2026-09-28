import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/local-tools.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture, envFrom } from "./test-helpers.ts";

const USER_AGENT_OK = "pnpm/11.15.1 npm/? node/v24.4.1 darwin arm64";
const USER_AGENT_OLD_NODE = "pnpm/11.15.1 npm/? node/v22.17.1 darwin arm64";
const USER_AGENT_WRONG_PNPM = "pnpm/9.0.0 npm/? node/v24.4.1 darwin arm64";

const PACKAGE_JSON = { packageManager: "pnpm@11.15.1" };
const CONFIG = { owner: "drcdev" };

describe("checks/local-tools", () => {
  it("is complete when Node >= 24, pnpm matches packageManager, and gh is signed in as the configured owner", async () => {
    const authStatus = loadFixture<{ signedIn: boolean; login: string | null }>(
      "github",
      "auth-status-signed-in-don",
    );
    const ctx = fakeProviderContext({
      env: envFrom({ npm_config_user_agent: USER_AGENT_OK }),
      fs: {
        readJson: ((path: string) => {
          if (path === "package.json") return PACKAGE_JSON;
          if (path === "setup/config.json") return CONFIG;
          return null;
        }) as never,
      },
      github: { authStatus: async () => authStatus },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.nextAction).toBeNull();
    expect(result.step).toBe("Step 1 of 18");
    expect(result.docs).toBe("docs/setup.md#local-tools");
  });

  it("is missing when the active Node major version is below 24", async () => {
    const ctx = fakeProviderContext({
      env: envFrom({ npm_config_user_agent: USER_AGENT_OLD_NODE }),
      fs: { readJson: (() => PACKAGE_JSON) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/node/i);
    expect(result.nextAction).toMatch(/nvm|node 24/i);
  });

  it("is missing when the active pnpm version does not match the packageManager pin", async () => {
    const ctx = fakeProviderContext({
      env: envFrom({ npm_config_user_agent: USER_AGENT_WRONG_PNPM }),
      fs: { readJson: (() => PACKAGE_JSON) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/pnpm/i);
    expect(result.nextAction).toMatch(/pnpm/i);
  });

  it("is missing when gh is not signed in", async () => {
    const ctx = fakeProviderContext({
      env: envFrom({ npm_config_user_agent: USER_AGENT_OK }),
      fs: {
        readJson: ((path: string) => (path === "package.json" ? PACKAGE_JSON : CONFIG)) as never,
      },
      github: { authStatus: async () => ({ signedIn: false, login: null }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/gh auth login/i);
  });

  it("is missing when gh is signed in as a different account than the configured owner", async () => {
    const ctx = fakeProviderContext({
      env: envFrom({ npm_config_user_agent: USER_AGENT_OK }),
      fs: {
        readJson: ((path: string) => (path === "package.json" ? PACKAGE_JSON : CONFIG)) as never,
      },
      github: { authStatus: async () => ({ signedIn: true, login: "someone-else" }) },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toContain("someone-else");
  });

  it("is could-not-check when npm_config_user_agent is absent (not run via pnpm)", async () => {
    const ctx = fakeProviderContext({});

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.nextAction).toMatch(/pnpm setup:check/i);
    expect(result.reason).toBeTruthy();
  });

  it("is could-not-check when gh auth status cannot be read", async () => {
    const ctx = fakeProviderContext({
      env: envFrom({ npm_config_user_agent: USER_AGENT_OK }),
      fs: {
        readJson: ((path: string) => (path === "package.json" ? PACKAGE_JSON : CONFIG)) as never,
      },
      github: {
        authStatus: async () => {
          throw new ProviderAccessError("gh api call timed out after 10 seconds");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/timed out/i);
  });
});
