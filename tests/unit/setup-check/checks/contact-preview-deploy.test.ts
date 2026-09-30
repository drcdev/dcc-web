import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-preview-deploy.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import { MIGRATIONS, PREVIEW_ID, PROD_ID, contactContext } from "./contact-helpers.ts";

const databases = async () => [
  { uuid: PROD_ID, name: "dcc-web-contact", runningInRegion: "WNAM" },
  { uuid: PREVIEW_ID, name: "dcc-web-contact-preview", runningInRegion: "WNAM" },
];

function cloud(overrides: Record<string, unknown> = {}) {
  return {
    listD1Databases: databases,
    listD1AppliedMigrations: async () => MIGRATIONS,
    listWorkerCrons: async () => ["17 3 * * *"],
    ...overrides,
  } as never;
}

describe("checks/contact-preview-deploy", () => {
  it("is complete when preview migrations match the files and the cron is registered", async () => {
    const result = await check(contactContext({ cloudflare: cloud() }));
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-preview-deploy");
  });

  it("reads the migrations of the preview database only", async () => {
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
    expect(asked).toBe(PREVIEW_ID);
  });

  it("is missing when a migration file is not applied", async () => {
    const result = await check(contactContext({ cloudflare: cloud({ listD1AppliedMigrations: async () => [] }) }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/0001_create_messages\.sql/);
    expect(result.nextAction).toMatch(/D1: Edit/);
  });

  it("is missing when the cron is not registered", async () => {
    const result = await check(contactContext({ cloudflare: cloud({ listWorkerCrons: async () => [] }) }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/17 3 \* \* \*/);
  });

  it("is missing when the preview database does not exist", async () => {
    const result = await check(contactContext({ cloudflare: cloud({ listD1Databases: async () => [] }) }));
    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/dcc-web-contact-preview/);
  });

  it("is pending while a dcc-web-preview build is running", async () => {
    const result = await check(
      contactContext({
        cloudflare: cloud({ listD1AppliedMigrations: async () => [] }),
        github: {
          api: (async (path: string) =>
            path.includes("/pulls")
              ? [{ number: 7, state: "open", head: { sha: "abc" } }]
              : { check_runs: [{ name: "Workers Builds: dcc-web-preview", status: "in_progress", conclusion: null }] }) as never,
        },
      }),
    );
    expect(result.status).toBe("pending");
    expect(result.nextAction).toMatch(/wait/i);
  });

  it("is not pending when the build finished", async () => {
    const result = await check(
      contactContext({
        cloudflare: cloud({ listD1AppliedMigrations: async () => [] }),
        github: {
          api: (async (path: string) =>
            path.includes("/pulls")
              ? [{ number: 7, state: "open", head: { sha: "abc" } }]
              : { check_runs: [{ name: "Workers Builds: dcc-web-preview", status: "completed", conclusion: "failure" }] }) as never,
        },
      }),
    );
    expect(result.status).toBe("missing");
  });

  it("is could-not-check without credentials", async () => {
    const result = await check(contactContext({ env: envFrom({}) }));
    expect(result.status).toBe("could-not-check");
  });

  it("is could-not-check on a 403 reading migrations", async () => {
    const result = await check(
      contactContext({
        cloudflare: cloud({
          listD1AppliedMigrations: async () => {
            throw new ProviderAccessError("Cloudflare token lacks D1: Read read access (403): x");
          },
        }),
      }),
    );
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/D1: Read/);
  });
});
