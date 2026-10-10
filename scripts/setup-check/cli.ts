#!/usr/bin/env node
// scripts/setup-check/cli.ts — `pnpm setup:check [--json] [--item <id> ...]
// [--no-network]`, per contracts/setup-check-cli.md. Prerequisite gating
// (data-model.md dependsOn) needs no separate logic here: every check that
// has a dependsOn prerequisite already evaluates it by calling the
// prerequisite's own check function with the same context — including
// when that item is requested directly with `--item`.
import { setupItems, getSetupItem } from "./items.ts";
import { buildReport, collectSecretValues, formatHumanReport, formatJsonReport } from "./report.ts";
import { configSchema, dnsBaselineSchema, githubRulesetSchema } from "./schemas.ts";
import { createGitHubReader } from "./providers/github.ts";
import { createCloudflareReader } from "./providers/cloudflare.ts";
import { createDnsReader } from "./providers/dns.ts";
import { createHttpReader } from "./providers/http.ts";
import { createEnvReader } from "./providers/env.ts";
import { createRepoReader } from "./providers/fs.ts";
import { couldNotCheck } from "./checks/shared.ts";
import { ProviderAccessError } from "./types.ts";
import type { CheckResult, CloudflareReader, GitHubReader, ProviderContext, SetupItem } from "./types.ts";

export class UsageError extends Error {}

export interface ParsedArgs {
  json: boolean;
  /** null means "every item" (no --item given). */
  items: string[] | null;
  noNetwork: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  let json = false;
  let noNetwork = false;
  const items: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === "--json") {
      json = true;
    } else if (arg === "--no-network") {
      noNetwork = true;
    } else if (arg === "--item") {
      const value = argv[i + 1];
      if (!value) throw new UsageError("--item requires a value");
      items.push(value);
      i += 1;
    } else {
      throw new UsageError(`unknown flag: ${arg}`);
    }
  }

  return { json, noNetwork, items: items.length > 0 ? items : null };
}

const LOCAL_ONLY_IDS = new Set(["local-tools", "local-credentials"]);
export const NO_NETWORK_REASON = "skipped: --no-network";
const PER_CALL_TIMEOUT_MS = 10_000;

function networkDisabledError(): ProviderAccessError {
  return new ProviderAccessError(NO_NETWORK_REASON);
}

/** github/cloudflare readers that reject instantly instead of making a request — used so local-tools and local-credentials still run their offline-checkable logic (Node/pnpm versions, .env names) under --no-network without ever attempting a network call. */
export function noNetworkContext(base: ProviderContext): ProviderContext {
  const github: GitHubReader = {
    api: async () => {
      throw networkDisabledError();
    },
    authStatus: async () => {
      throw networkDisabledError();
    },
  };
  const cloudflare: CloudflareReader = {
    verifyToken: async () => {
      throw networkDisabledError();
    },
    getZone: async () => {
      throw networkDisabledError();
    },
    listZones: async () => {
      throw networkDisabledError();
    },
    listDnsRecords: async () => {
      throw networkDisabledError();
    },
    getWorkerScript: async () => {
      throw networkDisabledError();
    },
    getWorkersSubdomain: async () => {
      throw networkDisabledError();
    },
    listWebAnalyticsSites: async () => {
      throw networkDisabledError();
    },
    listEmailRoutingAddresses: async () => {
      throw networkDisabledError();
    },
    listD1Databases: async () => {
      throw networkDisabledError();
    },
    listD1AppliedMigrations: async () => {
      throw networkDisabledError();
    },
    listWorkerSecretNames: async () => {
      throw networkDisabledError();
    },
    listWorkerCrons: async () => {
      throw networkDisabledError();
    },
    listBuildTriggers: async () => {
      throw networkDisabledError();
    },
    listBuildVariableNames: async () => {
      throw networkDisabledError();
    },
    listTurnstileWidgets: async () => {
      throw networkDisabledError();
    },
  };
  return { ...base, github, cloudflare };
}

function withTimeout(promise: Promise<CheckResult>, item: SetupItem): Promise<CheckResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(
        couldNotCheck(
          { id: item.id, order: item.order },
          `Could not finish checking ${item.title} in time.`,
          `${item.id} check timed out after ${PER_CALL_TIMEOUT_MS / 1000} seconds.`,
          "Try again; if it keeps timing out, check your network connection and credentials.",
        ),
      );
    }, PER_CALL_TIMEOUT_MS);
    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (err: unknown) => {
        clearTimeout(timer);
        resolve(
          couldNotCheck(
            { id: item.id, order: item.order },
            `Could not check ${item.title}.`,
            err instanceof Error ? err.message : String(err),
            "Try again; if it keeps failing, check your network connection and credentials.",
          ),
        );
      },
    );
  });
}

async function runOne(target: SetupItem, parsed: ParsedArgs, ctx: ProviderContext): Promise<CheckResult> {
  if (parsed.noNetwork && !LOCAL_ONLY_IDS.has(target.id)) {
    return couldNotCheck(
      { id: target.id, order: target.order },
      `Skipped ${target.title}: no network is allowed for this run.`,
      NO_NETWORK_REASON,
      "Run pnpm setup:check again without --no-network to check this item.",
    );
  }
  const runCtx = parsed.noNetwork ? noNetworkContext(ctx) : ctx;
  return withTimeout(target.check(runCtx), target);
}

export interface RunChecksOptions {
  items: SetupItem[];
  parsed: ParsedArgs;
  ctx: ProviderContext;
}

export interface RunChecksResult {
  results: CheckResult[];
  usageError?: string;
}

/** Resolves --item to registry entries (or every item) and runs each one's check, honouring --no-network. Exported so CLI behaviour can be tested without spawning a process or touching real providers. */
export async function runChecks(options: RunChecksOptions): Promise<RunChecksResult> {
  const { items, parsed, ctx } = options;

  let targets: SetupItem[];
  if (parsed.items) {
    targets = [];
    for (const id of parsed.items) {
      const found = items.find((i) => i.id === id);
      if (!found) {
        return { results: [], usageError: `unknown item: ${id}` };
      }
      targets.push(found);
    }
  } else {
    targets = items;
  }

  const results = await Promise.all(targets.map((target) => runOne(target, parsed, ctx)));
  return { results };
}

function validateSetupJson(fs: ProviderContext["fs"]): string | null {
  const checks: Array<[string, { safeParse: (input: unknown) => { success: boolean; error?: { message: string } } }]> = [
    ["setup/config.json", configSchema],
    ["setup/dns-baseline.json", dnsBaselineSchema],
    ["setup/github-ruleset.json", githubRulesetSchema],
  ];
  for (const [path, schema] of checks) {
    const raw = fs.readJson(path);
    if (raw === null) continue;
    const result = schema.safeParse(raw);
    if (!result.success) {
      return `${path} is invalid: ${result.error?.message ?? "unknown validation error"}`;
    }
  }
  return null;
}

function createDefaultContext(): ProviderContext {
  const env = createEnvReader();
  return {
    github: createGitHubReader(),
    cloudflare: createCloudflareReader({ token: env.get("CLOUDFLARE_API_TOKEN") ?? "" }),
    dns: createDnsReader(),
    http: createHttpReader(),
    env,
    fs: createRepoReader(),
    now: () => new Date(),
  };
}

export interface MainOptions {
  items?: SetupItem[];
  ctx?: ProviderContext;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

/** Runs the CLI and returns the process exit code (0/1/2 per contracts/setup-check-cli.md), writing to the given (or real) stdout/stderr. Exported for tests; the guard below calls it for the real `node scripts/setup-check/cli.ts` invocation. */
export async function main(argv: string[], options: MainOptions = {}): Promise<number> {
  const stdout = options.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = options.stderr ?? ((text: string) => process.stderr.write(text));
  const items = options.items ?? setupItems;

  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    stderr(`${err instanceof Error ? err.message : String(err)}\n`);
    return 2;
  }

  const ctx = options.ctx ?? createDefaultContext();

  const invalid = validateSetupJson(ctx.fs);
  if (invalid) {
    stderr(`${invalid}\n`);
    return 2;
  }

  if (parsed.items) {
    for (const id of parsed.items) {
      if (!items.find((i) => i.id === id) && !getSetupItem(id)) {
        stderr(`unknown item: ${id}\n`);
        return 2;
      }
    }
  }

  const { results, usageError } = await runChecks({ items, parsed, ctx });
  if (usageError) {
    stderr(`${usageError}\n`);
    return 2;
  }

  const report = buildReport(results, items, { secretValues: collectSecretValues(ctx.env) });

  if (parsed.json) {
    stdout(`${formatJsonReport(report)}\n`);
  } else {
    const color = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
    stdout(`${formatHumanReport(report, { color })}\n`);
  }

  return report.ok ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
