import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-turnstile-site-key.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import { contactContext, nonProdTrigger, trigger } from "./contact-helpers.ts";

function triggersFor(byWorker: Record<string, ReturnType<typeof trigger>[]>) {
  return async (_account: string, script: string) => byWorker[script] ?? [];
}

const KEY = "PUBLIC_TURNSTILE_SITE_KEY";

describe("checks/contact-turnstile-site-key", () => {
  it("is complete when every trigger of both Workers has the variable", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listBuildTriggers: triggersFor({
            "dcc-web": [trigger({ uuid: "p1" })],
            "dcc-web-preview": [trigger({ uuid: "v1" }), nonProdTrigger({ uuid: "v2" })],
          }),
          listBuildVariableNames: async () => [KEY, "OTHER"],
        },
      }),
    );
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-turnstile-site-key");
  });

  it("names the trigger missing the variable, per Worker", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listBuildTriggers: triggersFor({
            "dcc-web": [trigger({ uuid: "p1" })],
            "dcc-web-preview": [trigger({ uuid: "v1" }), nonProdTrigger({ uuid: "v2" })],
          }),
          listBuildVariableNames: async (_a, uuid) => (uuid === "v2" ? [] : [KEY]),
        },
      }),
    );
    expect(result.status).toBe("missing");
    const details = result.details.join("\n");
    expect(details).toMatch(/dcc-web-preview/);
    expect(details).toMatch(/Deploy non-production branches/);
    expect(details).not.toMatch(/dcc-web:/);
  });

  it("is missing when a Worker has no build trigger at all", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listBuildTriggers: triggersFor({ "dcc-web": [trigger()] }),
          listBuildVariableNames: async () => [KEY],
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/dcc-web-preview.*no build trigger/i);
  });

  it("is could-not-check without an account ID", async () => {
    const result = await check(contactContext({ env: envFrom({ CLOUDFLARE_API_TOKEN: "x" }) }));
    expect(result.status).toBe("could-not-check");
  });

  it("is could-not-check on a 403", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listBuildTriggers: async () => {
            throw new ProviderAccessError("Cloudflare token lacks Workers Builds Configuration: Read read access (403): x");
          },
        },
      }),
    );
    expect(result.status).toBe("could-not-check");
  });
});
