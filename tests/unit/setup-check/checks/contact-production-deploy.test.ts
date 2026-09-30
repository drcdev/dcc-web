import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-production-deploy.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import { MIGRATIONS, PREVIEW_ID, PROD_ID, contactContext, nonProdTrigger, trigger } from "./contact-helpers.ts";

const production = trigger({ deployCommand: "pnpm run deploy:production" });

function cloud(overrides: Record<string, unknown> = {}) {
  return {
    listD1Databases: async () => [
      { uuid: PROD_ID, name: "contact", runningInRegion: "WNAM" },
      { uuid: PREVIEW_ID, name: "contact-preview", runningInRegion: "WNAM" },
    ],
    listBuildTriggers: async () => [production],
    listD1AppliedMigrations: async () => MIGRATIONS,
    listWorkerCrons: async () => ["17 3 * * *"],
    ...overrides,
  } as never;
}

describe("checks/contact-production-deploy", () => {
  it("is complete when the production trigger, migrations and cron are all in place", async () => {
    const result = await check(contactContext({ cloudflare: cloud() }));
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-production-deploy");
  });

  it("reads the migrations of the production database only", async () => {
    let asked = "";
    await check(
      contactContext({
        cloudflare: cloud({
          listD1AppliedMigrations: async (_a: string, uuid: string) => {
            asked = uuid;
            return MIGRATIONS;
          },
        }),
      }),
    );
    expect(asked).toBe(PROD_ID);
  });

  it("is missing when the production trigger still uses the old deploy command", async () => {
    const result = await check(
      contactContext({
        cloudflare: cloud({ listBuildTriggers: async () => [trigger({ deployCommand: "npx wrangler deploy" })] }),
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/pnpm run deploy:production/);
  });

  it("ignores non-production triggers when judging the production deploy command", async () => {
    const result = await check(
      contactContext({ cloudflare: cloud({ listBuildTriggers: async () => [production, nonProdTrigger()] }) }),
    );
    expect(result.status).toBe("complete");
  });

  it("is missing when migrations are not applied, naming the files", async () => {
    const result = await check(contactContext({ cloudflare: cloud({ listD1AppliedMigrations: async () => [] }) }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/0001_create_messages\.sql/);
    expect(result.nextAction).toMatch(/Retry/i);
  });

  it("is missing when the cron is not registered on dcc-web", async () => {
    const result = await check(contactContext({ cloudflare: cloud({ listWorkerCrons: async () => [] }) }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/cron/i);
  });

  it("is missing when the production database does not exist", async () => {
    const result = await check(contactContext({ cloudflare: cloud({ listD1Databases: async () => [] }) }));
    expect(result.status).toBe("missing");
  });

  it("is could-not-check without credentials", async () => {
    const result = await check(contactContext({ env: envFrom({}) }));
    expect(result.status).toBe("could-not-check");
  });

  it("is could-not-check when Cloudflare cannot be read", async () => {
    const result = await check(
      contactContext({
        cloudflare: cloud({
          listBuildTriggers: async () => {
            throw new ProviderAccessError("Cloudflare had a server error (500): x");
          },
        }),
      }),
    );
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/500/);
  });
});
