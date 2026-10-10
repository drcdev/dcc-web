// Shared helpers for the contact-bindings setup item (checks/contact-bindings.ts).
// Everything here is read-only and names-only: no helper returns a secret or variable value.
import type { CheckResult, CloudflareBuildTrigger, ProviderContext, SetupConfig } from "../types.ts";
import { stripJsonc } from "../../lib/jsonc.ts";
import { couldNotCheck, type ItemLabel } from "./shared.ts";

export const PRODUCTION_DB_NAME = "dcc-web";
export const PREVIEW_DB_NAME = "dcc-web-preview";
export const REQUIRED_WORKER_SECRETS = ["TURNSTILE_SECRET_KEY"] as const;
export const SITE_KEY_VARIABLE = "PUBLIC_TURNSTILE_SITE_KEY";
export const PRODUCTION_DEPLOY_COMMAND = "pnpm run deploy:production";
export const EXPECTED_REGION = "WNAM";

interface WranglerDatabase {
  database_name?: string;
  database_id?: string;
}

interface WranglerConfig {
  send_email?: Array<{ destination_address?: string; allowed_sender_addresses?: string[] }>;
  d1_databases?: WranglerDatabase[];
  env?: { preview?: { d1_databases?: WranglerDatabase[] } };
}

export interface ContactDatabaseConfig {
  name: string;
  /** The `database_id` committed in wrangler.jsonc ("" when absent). */
  id: string;
  /** True for the all-zero placeholder IDs that stand in until the databases exist. */
  placeholder: boolean;
}

export interface ContactConfig {
  production: ContactDatabaseConfig;
  preview: ContactDatabaseConfig;
}

export function isPlaceholderId(id: string): boolean {
  return id === "" || /^0{8}-0{4}-0{4}-0{4}-0{11}[0-9]$/.test(id);
}

function toDatabase(entry: WranglerDatabase | undefined, fallbackName: string): ContactDatabaseConfig {
  const id = entry?.database_id ?? "";
  return { name: entry?.database_name ?? fallbackName, id, placeholder: isPlaceholderId(id) };
}

/** Reads the D1 IDs the Workers are expected to have from wrangler.jsonc; null when unreadable. */
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
  };
}

export interface EmailConfig {
  /** `send_email[0].destination_address`: the one verified address the form emails. */
  destination: string;
  /** The sending domain, taken from `allowed_sender_addresses[0]` (e.g. "drc.dev"). */
  sendingDomain: string;
}

/** Reads the email destination and sending domain from wrangler.jsonc; null when unreadable or absent. */
export function readEmailConfig(ctx: ProviderContext): EmailConfig | null {
  const text = ctx.fs.readText("wrangler.jsonc");
  if (text === null) return null;
  let parsed: WranglerConfig;
  try {
    parsed = JSON.parse(stripJsonc(text)) as WranglerConfig;
  } catch {
    return null;
  }
  const binding = parsed.send_email?.[0];
  const destination = binding?.destination_address;
  const sender = binding?.allowed_sender_addresses?.[0];
  const sendingDomain = sender?.split("@")[1];
  if (!destination || !sendingDomain) return null;
  return { destination, sendingDomain };
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
