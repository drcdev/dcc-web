import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-worker-secrets.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import { contactContext } from "./contact-helpers.ts";

const ALL = ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"];

function secretsFor(byWorker: Record<string, string[]>) {
  return async (_account: string, script: string) => byWorker[script] ?? [];
}

describe("checks/contact-worker-secrets", () => {
  it("is complete when both Workers have all three secret names", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: async (_a, name) => ({ id: name }),
          listWorkerSecretNames: secretsFor({ "dcc-web": ALL, "dcc-web-preview": ALL }),
        },
      }),
    );
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-worker-secrets");
  });

  it("lists missing names per Worker", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: async (_a, name) => ({ id: name }),
          listWorkerSecretNames: secretsFor({ "dcc-web": ALL, "dcc-web-preview": ["TURNSTILE_SECRET_KEY"] }),
        },
      }),
    );
    expect(result.status).toBe("missing");
    const details = result.details.join("\n");
    expect(details).toMatch(/dcc-web-preview.*CONTACT_READ_TOKEN.*IP_HASH_SALT/);
    expect(details).not.toMatch(/^dcc-web:/m);
    expect(result.nextAction).toMatch(/wrangler secret put/);
    expect(result.nextAction).toMatch(/--env preview/);
  });

  it("says when the preview Worker does not exist yet", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: async (_a, name) => (name === "dcc-web" ? { id: name } : null),
          listWorkerSecretNames: secretsFor({ "dcc-web": ALL }),
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/dcc-web-preview does not exist/);
  });

  it("never puts a secret value in its output", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: async (_a, name) => ({ id: name }),
          listWorkerSecretNames: secretsFor({ "dcc-web": ALL, "dcc-web-preview": ALL }),
        },
      }),
    );
    expect(JSON.stringify(result)).not.toContain("cf-token-value");
  });

  it("is could-not-check without an API token", async () => {
    const result = await check(contactContext({ env: envFrom({}) }));
    expect(result.status).toBe("could-not-check");
  });

  it("is could-not-check on a 403", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          getWorkerScript: async (_a, name) => ({ id: name }),
          listWorkerSecretNames: async () => {
            throw new ProviderAccessError("Cloudflare token lacks Workers Scripts: Read read access (403): x");
          },
        },
      }),
    );
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/Workers Scripts: Read/);
  });
});
