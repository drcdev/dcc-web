import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-preview-builds.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import { contactContext, nonProdTrigger, trigger } from "./contact-helpers.ts";

function triggersFor(byWorker: Record<string, ReturnType<typeof trigger>[]>) {
  return async (_account: string, script: string) => byWorker[script] ?? [];
}

const exists = async (_a: string, name: string) => ({ id: name });

describe("checks/contact-preview-builds", () => {
  it("is complete when preview builds deploy with deploy:preview and production has no branch trigger", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: exists,
          listBuildTriggers: triggersFor({
            "dcc-web-preview": [trigger(), nonProdTrigger()],
            "dcc-web": [trigger({ deployCommand: "pnpm run deploy:production" })],
          }),
        },
      }),
    );
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-preview-builds");
  });

  it("is missing when the preview Worker does not exist", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: async (_a, name) => (name === "dcc-web" ? { id: name } : null),
          listBuildTriggers: triggersFor({}),
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/dcc-web-preview/);
  });

  it("is missing when the non-production trigger is not set up on the preview Worker", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: exists,
          listBuildTriggers: triggersFor({ "dcc-web-preview": [trigger()], "dcc-web": [trigger()] }),
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/non-production/i);
  });

  it("is missing when a preview trigger uses the wrong deploy command", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: exists,
          listBuildTriggers: triggersFor({
            "dcc-web-preview": [trigger(), nonProdTrigger({ deployCommand: "npx wrangler versions upload" })],
            "dcc-web": [trigger()],
          }),
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/pnpm run deploy:preview/);
  });

  it("is missing when dcc-web still builds non-production branches", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: exists,
          listBuildTriggers: triggersFor({
            "dcc-web-preview": [trigger(), nonProdTrigger()],
            "dcc-web": [trigger(), nonProdTrigger()],
          }),
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/dcc-web.*non-production/i);
  });

  it("is could-not-check without credentials", async () => {
    const result = await check(contactContext({ env: envFrom({}) }));
    expect(result.status).toBe("could-not-check");
  });

  it("is could-not-check when the token lacks Workers Builds Configuration: Read", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: exists,
          listBuildTriggers: async () => {
            throw new ProviderAccessError(
              "Cloudflare token lacks Workers Builds Configuration read access (403): x",
            );
          },
        },
      }),
    );
    expect(result.status).toBe("could-not-check");
    expect(result.nextAction).toMatch(/Workers Builds Configuration: Read/);
  });
});
