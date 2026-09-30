// Shared helpers for the contact-form setup items 19 to 25 (specs/007-contact-form/contracts/setup-items.md).
// Everything here is read-only and names-only: no helper returns a secret or variable value.
import type { CheckResult, CloudflareBuildTrigger, ProviderContext, SetupConfig } from "../types.ts";
import { couldNotCheck, type ItemLabel } from "./shared.ts";

export const PRODUCTION_DB_NAME = "contact";
export const PREVIEW_DB_NAME = "contact-preview";
export const REQUIRED_WORKER_SECRETS = ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"] as const;
export const SITE_KEY_VARIABLE = "PUBLIC_TURNSTILE_SITE_KEY";
export const DEFAULT_CRON = "17 3 * * *";
export const PREVIEW_DEPLOY_COMMAND = "pnpm run deploy:preview";
export const PRODUCTION_DEPLOY_COMMAND = "pnpm run deploy:production";
export const EXPECTED_REGION = "WNAM";

/** Removes // and block comments and trailing commas from JSONC, leaving string contents alone. */
export function stripJsonc(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (ch === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
    } else if (ch === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
    } else {
      out += ch;
      i++;
    }
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

interface WranglerDatabase {
  database_name?: string;
  database_id?: string;
}

interface WranglerConfig {
  triggers?: { crons?: string[] };
  d1_databases?: WranglerDatabase[];
  env?: { preview?: { triggers?: { crons?: string[] }; d1_databases?: WranglerDatabase[] } };
}

export interface ContactDatabaseConfig {
  name: string;
  /** The `database_id` committed in wrangler.jsonc ("" when absent). */
  id: string;
  /** True for the all-zero placeholder IDs that stand in until item 19 is done. */
  placeholder: boolean;
}

export interface ContactConfig {
  production: ContactDatabaseConfig;
  preview: ContactDatabaseConfig;
  productionCron: string;
  previewCron: string;
}

export function isPlaceholderId(id: string): boolean {
  return id === "" || /^0{8}-0{4}-0{4}-0{4}-0{11}[0-9]$/.test(id);
}

function toDatabase(entry: WranglerDatabase | undefined, fallbackName: string): ContactDatabaseConfig {
  const id = entry?.database_id ?? "";
  return { name: entry?.database_name ?? fallbackName, id, placeholder: isPlaceholderId(id) };
}

/** Reads the D1 IDs and crons the Workers are expected to have from wrangler.jsonc; null when unreadable. */
export function readContactConfig(ctx: ProviderContext): ContactConfig | null {
  const text = ctx.fs.readText("wrangler.jsonc");
  if (text === null) return null;
  let parsed: WranglerConfig;
  try {
    parsed = JSON.parse(stripJsonc(text)) as WranglerConfig;
  } catch {
    return null;
  }
  return {
    production: toDatabase(parsed.d1_databases?.[0], PRODUCTION_DB_NAME),
    preview: toDatabase(parsed.env?.preview?.d1_databases?.[0], PREVIEW_DB_NAME),
    productionCron: parsed.triggers?.crons?.[0] ?? DEFAULT_CRON,
    previewCron: parsed.env?.preview?.triggers?.crons?.[0] ?? DEFAULT_CRON,
  };
}

export function workerNames(ctx: ProviderContext): { production: string; preview: string } {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  return {
    production: config?.workerName ?? "dcc-web",
    preview: config?.previewWorkerName ?? "dcc-web-preview",
  };
}

/** The account ID, or a could-not-check result naming the missing .env entry. */
export function requireCloudflareAccess(
  ctx: ProviderContext,
  item: ItemLabel,
  summary: string,
): { accountId: string } | CheckResult {
  if (!ctx.env.has("CLOUDFLARE_API_TOKEN")) {
    return couldNotCheck(
      item,
      summary,
      "CLOUDFLARE_API_TOKEN is not set in .env.",
      "Create a read-only token (docs/setup.md#local-credentials) and add it to .env.",
    );
  }
  const accountId = ctx.env.get("CLOUDFLARE_ACCOUNT_ID");
  if (!accountId) {
    return couldNotCheck(
      item,
      summary,
      "CLOUDFLARE_ACCOUNT_ID is not set in .env.",
      "Add CLOUDFLARE_ACCOUNT_ID to .env (docs/setup.md#local-credentials).",
    );
  }
  return { accountId };
}

export function isCheckResult(value: unknown): value is CheckResult {
  return typeof value === "object" && value !== null && "status" in value && "nextAction" in value;
}

export function wranglerUnreadable(item: ItemLabel, summary: string): CheckResult {
  return couldNotCheck(
    item,
    summary,
    "wrangler.jsonc could not be read or parsed.",
    "Restore wrangler.jsonc from the repository (git checkout wrangler.jsonc), then try again.",
  );
}

/** Non-production branch builds match every branch ("*"); the production trigger names the production branch. */
export function isNonProductionTrigger(trigger: CloudflareBuildTrigger): boolean {
  return trigger.branchIncludes.includes("*");
}

/** Migration files committed in migrations/, sorted. */
export function migrationFiles(ctx: ProviderContext): string[] {
  return ctx.fs
    .listFiles("migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

/** Migration files present in the repository but not recorded as applied. */
export function unappliedMigrations(ctx: ProviderContext, applied: string[]): string[] {
  const done = new Set(applied);
  return migrationFiles(ctx).filter((f) => !done.has(f));
}
