// Fixtures shared by the contact-form check tests (items 19 to 25). Not a test file.
import { vi } from "vitest";
import type { CloudflareBuildTrigger, ProviderContext } from "../../../../scripts/setup-check/types.ts";
import { envFrom, fakeProviderContext, type FakeProviderOverrides } from "./test-helpers.ts";

export const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-value", CLOUDFLARE_ACCOUNT_ID: "acct-123" };
export const PROD_ID = "11111111-1111-4111-8111-111111111111";
export const PREVIEW_ID = "22222222-2222-4222-8222-222222222222";
export const CONFIG = { workerName: "dcc-web", previewWorkerName: "dcc-web-preview" };
export const MIGRATIONS = ["0001_create_messages.sql"];

/** wrangler.jsonc text with comments and trailing commas, like the real file. */
export function wranglerText(ids: { production: string; preview: string } = { production: PROD_ID, preview: PREVIEW_ID }) {
  return `{
  // comment with a "quoted" word and a url https://example.com
  "name": "dcc-web",
  "triggers": { "crons": ["17 3 * * *"] },
  "d1_databases": [
    { "binding": "DB", "database_name": "contact", "database_id": "${ids.production}", },
  ],
  "env": {
    "preview": {
      "name": "dcc-web-preview",
      "triggers": { "crons": ["17 3 * * *"] },
      /* block */
      "d1_databases": [
        { "binding": "DB", "database_name": "contact-preview", "database_id": "${ids.preview}" }
      ]
    }
  }
}`;
}

export const PLACEHOLDER_IDS = {
  production: "00000000-0000-0000-0000-000000000001",
  preview: "00000000-0000-0000-0000-000000000002",
};

export function trigger(overrides: Partial<CloudflareBuildTrigger> = {}): CloudflareBuildTrigger {
  return {
    uuid: "t-prod",
    name: "Deploy default branch",
    branchIncludes: ["main"],
    branchExcludes: [],
    buildCommand: "pnpm run build",
    deployCommand: "pnpm run deploy:preview",
    ...overrides,
  };
}

export function nonProdTrigger(overrides: Partial<CloudflareBuildTrigger> = {}): CloudflareBuildTrigger {
  return trigger({
    uuid: "t-branch",
    name: "Deploy non-production branches",
    branchIncludes: ["*"],
    branchExcludes: ["main"],
    ...overrides,
  });
}

export function contactContext(overrides: FakeProviderOverrides = {}, opts: { wrangler?: string | null } = {}): ProviderContext {
  const wrangler = opts.wrangler === undefined ? wranglerText() : opts.wrangler;
  return fakeProviderContext({
    ...overrides,
    env: overrides.env ?? envFrom(ENV),
    fs: {
      readJson: vi.fn(() => CONFIG) as never,
      readText: vi.fn((path: string) => (path === "wrangler.jsonc" ? wrangler : null)) as never,
      listFiles: vi.fn(() => ["0001_create_messages.sql", "README.md"]),
      ...overrides.fs,
    },
  });
}
