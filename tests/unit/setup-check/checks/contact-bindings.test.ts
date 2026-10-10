// Layer: unit. The folded contact item reads five parts (databases, Turnstile widget, Worker
// secrets, site key build variable, production deploy) through one fake Cloudflare reader.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-bindings.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import {
  MIGRATIONS,
  PLACEHOLDER_IDS,
  PREVIEW_ID,
  PROD_ID,
  contactContext,
  nonProdTrigger,
  trigger,
  wranglerText,
} from "./contact-helpers.ts";

const KEY = "PUBLIC_TURNSTILE_SITE_KEY";
const ALL_SECRETS = ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"];
const production = trigger({ deployCommand: "pnpm run deploy:production" });
const widget = { name: "dcc-web contact", domains: ["doncoleman.ca", "drc-dev.workers.dev"], mode: "managed" };
const databases = [
  { uuid: PROD_ID, name: "dcc-web", runningInRegion: "WNAM" },
  { uuid: PREVIEW_ID, name: "dcc-web-preview", runningInRegion: "WNAM" },
];

/** A reader where every part passes; each test overrides the one call it exercises. */
function cloud(overrides: Record<string, unknown> = {}) {
  return {
    listD1Databases: async () => databases,
    listTurnstileWidgets: async () => [widget],
    getWorkerScript: async (_a: string, name: string) => ({ id: name }),
    listWorkerSecretNames: async () => ALL_SECRETS,
    listBuildTriggers: async (_a: string, script: string) =>
      script === "dcc-web" ? [production] : [trigger({ uuid: "v1" }), nonProdTrigger({ uuid: "v2" })],
    listBuildVariableNames: async () => [KEY],
    listD1AppliedMigrations: async () => MIGRATIONS,
    listWorkerCrons: async () => ["17 3 * * *"],
    ...overrides,
  } as never;
}

async function run(overrides: Record<string, unknown> = {}, opts: { wrangler?: string | null } = {}) {
  return check(contactContext({ cloudflare: cloud(overrides) }, opts));
}

describe("checks/contact-bindings", () => {
  it("is complete when every part is in place", async () => {
    const result = await run();
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-bindings");
    expect(result.docs).toBe("docs/setup.md#contact-bindings");
    expect(result.nextAction).toBeNull();
  });

  describe("access", () => {
    it("is could-not-check without an API token", async () => {
      const result = await check(contactContext({ env: envFrom({}) }));
      expect(result.status).toBe("could-not-check");
      expect(result.reason).toMatch(/CLOUDFLARE_API_TOKEN/);
    });

    it("is could-not-check without the account ID", async () => {
      const result = await check(contactContext({ env: envFrom({ CLOUDFLARE_API_TOKEN: "x" }) }));
      expect(result.status).toBe("could-not-check");
      expect(result.reason).toMatch(/CLOUDFLARE_ACCOUNT_ID/);
    });

    it("is could-not-check when wrangler.jsonc cannot be read", async () => {
      const result = await run({}, { wrangler: null });
      expect(result.status).toBe("could-not-check");
    });

    it("is could-not-check on a 403 and names every read permission", async () => {
      const result = await run({
        listD1Databases: async () => {
          throw new ProviderAccessError("Cloudflare token lacks D1: Read read access (403): x");
        },
      });
      expect(result.status).toBe("could-not-check");
      expect(result.reason).toMatch(/D1: Read/);
      for (const permission of [
        "D1: Read",
        "Turnstile Sites: Read",
        "Workers Builds Configuration: Read",
        "Workers Scripts: Read",
      ]) {
        expect(result.nextAction).toContain(permission);
      }
    });

    it("is could-not-check when Cloudflare cannot be read", async () => {
      const result = await run({
        listBuildTriggers: async () => {
          throw new ProviderAccessError("Cloudflare had a server error (500): x");
        },
      });
      expect(result.status).toBe("could-not-check");
      expect(result.reason).toMatch(/500/);
    });
  });

  describe("Databases", () => {
    it("is missing when one database does not exist", async () => {
      const result = await run({ listD1Databases: async () => [databases[0]!] });
      expect(result.status).toBe("missing");
      expect(result.summary).toBe("Some contact bindings are not in place.");
      expect(result.details.join("\n")).toMatch(/Databases: .*dcc-web-preview.*not found/);
      expect(result.nextAction).toMatch(/wrangler d1 create/);
      expect(result.nextAction).toContain("docs/setup.md#contact-bindings");
    });

    it("is missing when wrangler.jsonc still holds the placeholder IDs", async () => {
      const result = await run({}, { wrangler: wranglerText(PLACEHOLDER_IDS) });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Databases: .*placeholder/i);
    });

    it("is missing when an ID differs from wrangler.jsonc", async () => {
      const other = databases.map((d) =>
        d.name === "dcc-web" ? { ...d, uuid: "33333333-3333-4333-8333-333333333333" } : d,
      );
      const result = await run({ listD1Databases: async () => other });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/does not match wrangler\.jsonc/);
    });

    it("is missing, never complete, when the region cannot be read", async () => {
      const noRegion = databases.map((d) => ({ uuid: d.uuid, name: d.name }));
      const result = await run({ listD1Databases: async () => noRegion });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/region could not be confirmed/i);
    });

    it("is missing when a database is in another region", async () => {
      const eu = databases.map((d) => ({ ...d, runningInRegion: "WEUR" }));
      const result = await run({ listD1Databases: async () => eu });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/WEUR/);
    });

    it("accepts a lower-case region value", async () => {
      const lower = databases.map((d) => ({ ...d, runningInRegion: "wnam" }));
      const result = await run({ listD1Databases: async () => lower });
      expect(result.status).toBe("complete");
    });

    it("parses the committed wrangler.jsonc and reads its database names", async () => {
      const text = readFileSync(fileURLToPath(new URL("../../../../wrangler.jsonc", import.meta.url)), "utf-8");
      const result = await run({}, { wrangler: text });
      // The fixture IDs differ from the real ones, so the names resolve but the IDs do not match.
      const details = result.details.join("\n");
      expect(result.status).toBe("missing");
      expect(details).toMatch(/does not match wrangler\.jsonc/);
      expect(details).not.toMatch(/not found in the account/);
    });
  });

  describe("Turnstile widget", () => {
    it("is missing, not an early return, when the widget does not exist", async () => {
      const calls: string[] = [];
      const result = await run({
        listTurnstileWidgets: async () => [{ ...widget, name: "other" }],
        listWorkerSecretNames: async () => {
          calls.push("secrets");
          return ALL_SECRETS;
        },
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Turnstile widget: .*dcc-web contact/);
      expect(calls).toContain("secrets");
    });

    it("is missing when the widget is not in managed mode", async () => {
      const result = await run({ listTurnstileWidgets: async () => [{ ...widget, mode: "invisible" }] });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/managed/);
    });

    it("is missing when doncoleman.ca is not a hostname", async () => {
      const result = await run({
        listTurnstileWidgets: async () => [{ ...widget, domains: ["drc-dev.workers.dev"] }],
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/doncoleman\.ca/);
    });

    it("stays missing when the hostnames only list subdomains of the bare domain", async () => {
      const result = await run({
        listTurnstileWidgets: async () => [{ ...widget, domains: ["www.doncoleman.ca", "drc-dev.workers.dev"] }],
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toContain("do not include doncoleman.ca");
    });

    it("is missing when drc-dev.workers.dev is absent and no preview fallback is in use", async () => {
      const result = await run({
        listTurnstileWidgets: async () => [{ ...widget, domains: ["doncoleman.ca"] }],
        listBuildVariableNames: async () => [],
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Turnstile widget: .*drc-dev\.workers\.dev/);
      expect(result.nextAction).toMatch(/test keys|fallback/i);
    });

    it("is complete with a note when the workers.dev hostname is refused and the preview fallback is in use", async () => {
      const result = await run({ listTurnstileWidgets: async () => [{ ...widget, domains: ["doncoleman.ca"] }] });
      expect(result.status).toBe("complete");
      expect(result.details.join("\n")).toMatch(/fallback/i);
    });
  });

  describe("Worker secrets", () => {
    const secretsFor = (byWorker: Record<string, string[]>) => async (_a: string, script: string) =>
      byWorker[script] ?? [];

    it("lists missing names per Worker", async () => {
      const result = await run({
        listWorkerSecretNames: secretsFor({ "dcc-web": ALL_SECRETS, "dcc-web-preview": ["TURNSTILE_SECRET_KEY"] }),
      });
      expect(result.status).toBe("missing");
      const details = result.details.join("\n");
      expect(details).toMatch(/Worker secrets: dcc-web-preview is missing: CONTACT_READ_TOKEN, IP_HASH_SALT/);
      expect(details).not.toMatch(/Worker secrets: dcc-web is missing/);
      expect(result.nextAction).toMatch(/wrangler secret put/);
      expect(result.nextAction).toMatch(/--env preview/);
    });

    it("says when the preview Worker does not exist yet, without stopping the other parts", async () => {
      const result = await run({
        getWorkerScript: async (_a: string, name: string) => (name === "dcc-web" ? { id: name } : null),
        listWorkerSecretNames: secretsFor({ "dcc-web": ALL_SECRETS }),
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Worker secrets: dcc-web-preview does not exist/);
    });

    it("reads names only and never puts a credential in its output", async () => {
      const result = await run();
      expect(JSON.stringify(result)).not.toContain("cf-token-value");
    });
  });

  describe("Site key", () => {
    const triggersFor = (byWorker: Record<string, ReturnType<typeof trigger>[]>) => async (_a: string, script: string) =>
      byWorker[script] ?? [];

    it("names the trigger missing the variable, per Worker", async () => {
      const result = await run({
        listBuildVariableNames: async (_a: string, uuid: string) => (uuid === "v2" ? [] : [KEY]),
      });
      expect(result.status).toBe("missing");
      const details = result.details.join("\n");
      expect(details).toMatch(/Site key: dcc-web-preview trigger "Deploy non-production branches" has no PUBLIC_TURNSTILE_SITE_KEY/);
      expect(details).not.toMatch(/Site key: dcc-web trigger/);
      expect(result.nextAction).toContain(KEY);
    });

    it("is missing when a Worker has no build trigger at all", async () => {
      const result = await run({
        listBuildTriggers: triggersFor({ "dcc-web": [production] }),
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Site key: dcc-web-preview has no build trigger/i);
    });
  });

  describe("Production deploy", () => {
    it("reads the migrations of the production database only", async () => {
      let asked = "";
      await run({
        listD1AppliedMigrations: async (_a: string, uuid: string) => {
          asked = uuid;
          return MIGRATIONS;
        },
      });
      expect(asked).toBe(PROD_ID);
    });

    it("is missing when the production trigger still uses another deploy command", async () => {
      const result = await run({
        listBuildTriggers: async (_a: string, script: string) =>
          script === "dcc-web" ? [trigger({ deployCommand: "npx wrangler deploy" })] : [trigger(), nonProdTrigger()],
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Production deploy: .*pnpm run deploy:production/);
      expect(result.nextAction).toMatch(/pnpm run deploy:production/);
    });

    it("is missing when dcc-web has no production trigger", async () => {
      const result = await run({
        listBuildTriggers: async (_a: string, script: string) =>
          script === "dcc-web" ? [nonProdTrigger()] : [trigger(), nonProdTrigger()],
      });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Production deploy: .*no production build trigger/);
    });

    it("ignores non-production triggers when judging the production deploy command", async () => {
      const result = await run({
        listBuildTriggers: async (_a: string, script: string) =>
          script === "dcc-web" ? [production, nonProdTrigger()] : [trigger(), nonProdTrigger()],
      });
      expect(result.status).toBe("complete");
    });

    it("is missing when migrations are not applied, naming the files", async () => {
      const result = await run({ listD1AppliedMigrations: async () => [] });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Production deploy: .*0001_create_messages\.sql/);
    });

    it("is missing when the cron is not registered on dcc-web", async () => {
      const result = await run({ listWorkerCrons: async () => [] });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Production deploy: .*Cron Trigger/);
    });

    it("is missing when the production database does not exist", async () => {
      const result = await run({ listD1Databases: async () => [databases[1]!] });
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(/Production deploy: .*dcc-web does not exist/);
    });
  });

  it("reports every failing part in one run, problems before notes", async () => {
    const result = await run({
      listD1Databases: async () => [],
      listTurnstileWidgets: async () => [],
      listWorkerCrons: async () => [],
    });
    expect(result.status).toBe("missing");
    const details = result.details.join("\n");
    for (const part of ["Databases:", "Turnstile widget:", "Production deploy:"]) expect(details).toContain(part);
  });
});
