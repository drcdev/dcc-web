// checks/contact-bindings.ts (setup item 16): the Cloudflare bindings the contact form needs are
// all in place. Five read-only parts run in one pass, so one run shows every gap:
//   Databases         both D1 databases exist, their IDs equal wrangler.jsonc (a placeholder ID counts
//                     as missing) and each reports region WNAM. `running_in_region` is not in
//                     Cloudflare's published schema, so an absent region is "could not be confirmed",
//                     never a pass.
//   Turnstile widget  "dcc-web contact" exists in managed mode and covers doncoleman.ca, and
//                     drc-dev.workers.dev unless the preview site-key fallback is in use.
//   Worker secrets    the three secret NAMES exist on both Workers. Values are never read.
//   Site key          the PUBLIC_TURNSTILE_SITE_KEY build variable exists on every build trigger of
//                     both Workers (names only).
//   Production deploy dcc-web's production trigger runs `pnpm run deploy:production`, its database has
//                     every migration, and it has the Cron Trigger from wrangler.jsonc.
// The preview Worker's builds, migrations and cron are covered by the CI preview wait and
// tests/unit/site/config-files.test.ts, not here.
import type { CheckResult, ProviderContext } from "../types.ts";
import {
  EXPECTED_REGION,
  PRODUCTION_DEPLOY_COMMAND,
  REQUIRED_WORKER_SECRETS,
  SITE_KEY_VARIABLE,
  isCheckResult,
  isNonProductionTrigger,
  readContactConfig,
  requireCloudflareAccess,
  unappliedMigrations,
  workerNames,
  wranglerUnreadable,
  type ContactConfig,
  type ContactDatabaseConfig,
} from "./contact-shared.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-bindings", order: 16 };
const SUMMARY = "Could not read the contact bindings.";
const DOCS = "docs/setup.md#contact-bindings";
const WIDGET_NAME = "dcc-web contact";
const PRODUCTION_HOST = "doncoleman.ca";
const PREVIEW_HOST = "drc-dev.workers.dev";

interface PartResult {
  problems: string[];
  notes: string[];
  fix: string;
}

type Reader = ProviderContext["cloudflare"];

async function checkDatabases(cloudflare: Reader, accountId: string, config: ContactConfig): Promise<PartResult> {
  const problems: string[] = [];
  const databases = await cloudflare.listD1Databases(accountId);
  for (const expected of [config.production, config.preview] satisfies ContactDatabaseConfig[]) {
    const found = databases.find((d) => d.name === expected.name);
    if (!found) {
      problems.push(`\`${expected.name}\` not found in the account.`);
      continue;
    }
    if (expected.placeholder) {
      problems.push(`${expected.name}: exists, but wrangler.jsonc still has a placeholder database_id.`);
    } else if (found.uuid !== expected.id) {
      problems.push(`${expected.name}: its ID does not match wrangler.jsonc.`);
    }
    if (found.runningInRegion === undefined) {
      problems.push(`${expected.name}: region could not be confirmed (Cloudflare did not report one).`);
    } else if (found.runningInRegion.toUpperCase() !== EXPECTED_REGION) {
      problems.push(`${expected.name}: is in region ${found.runningInRegion}, not ${EXPECTED_REGION}.`);
    }
  }
  return {
    problems,
    notes: [],
    fix: `Create each missing database with pnpm exec wrangler d1 create <name> --location wnam, then put the IDs from pnpm exec wrangler d1 list --json into wrangler.jsonc (${DOCS}).`,
  };
}

async function checkWidget(
  cloudflare: Reader,
  accountId: string,
  previewWorker: string,
): Promise<PartResult> {
  const fix = `Edit the widget in Cloudflare dashboard → Turnstile: name "${WIDGET_NAME}", managed mode, hostnames ${PRODUCTION_HOST} and ${PREVIEW_HOST}. If the dashboard refuses ${PREVIEW_HOST}, use the preview fallback with test keys (${DOCS}).`;
  const widgets = await cloudflare.listTurnstileWidgets(accountId);
  const widget = widgets.find((w) => w.name === WIDGET_NAME);
  if (!widget) {
    return { problems: [`The Turnstile widget "${WIDGET_NAME}" does not exist yet.`], notes: [], fix };
  }

  const problems: string[] = [];
  const notes: string[] = [];
  const hosts = widget.domains.map((d) => d.toLowerCase());
  if (widget.mode !== "managed") problems.push(`The widget mode is "${widget.mode}"; it must be managed.`);
  if (!hosts.includes(PRODUCTION_HOST)) problems.push(`The widget's hostnames do not include ${PRODUCTION_HOST}.`);
  if (!hosts.includes(PREVIEW_HOST)) {
    // The fallback is recognised by the preview site-key build variable existing.
    let fallback = false;
    for (const trigger of await cloudflare.listBuildTriggers(accountId, previewWorker)) {
      const variables = await cloudflare.listBuildVariableNames(accountId, trigger.uuid);
      if (variables.includes(SITE_KEY_VARIABLE)) fallback = true;
    }
    if (fallback) {
      notes.push(`The widget does not list ${PREVIEW_HOST}; the preview fallback (test keys, preview only) is in use.`);
    } else {
      problems.push(`The widget's hostnames do not include ${PREVIEW_HOST}.`);
    }
  }
  return { problems, notes, fix };
}

async function checkSecrets(
  cloudflare: Reader,
  accountId: string,
  names: { production: string; preview: string },
): Promise<PartResult> {
  const problems: string[] = [];
  for (const [worker, env] of [
    [names.production, ""],
    [names.preview, " --env preview"],
  ] as const) {
    if (!(await cloudflare.getWorkerScript(accountId, worker))) {
      problems.push(
        `${worker} does not exist yet, so none of its secrets are set${env ? " (the first preview secret command creates it)" : ""}.`,
      );
      continue;
    }
    const present = new Set(await cloudflare.listWorkerSecretNames(accountId, worker));
    const absent = REQUIRED_WORKER_SECRETS.filter((s) => !present.has(s));
    if (absent.length > 0) problems.push(`${worker} is missing: ${absent.join(", ")}.`);
  }
  return {
    problems,
    notes: [],
    fix: `Run pnpm exec wrangler secret put <NAME> for each missing name (add --env preview for dcc-web-preview) as described in ${DOCS}. Type the value at the prompt; never paste it into a chat or a file.`,
  };
}

async function checkSiteKey(
  cloudflare: Reader,
  accountId: string,
  names: { production: string; preview: string },
): Promise<PartResult> {
  const problems: string[] = [];
  for (const worker of [names.production, names.preview]) {
    const triggers = await cloudflare.listBuildTriggers(accountId, worker);
    if (triggers.length === 0) {
      problems.push(`${worker} has no build trigger yet, so the variable cannot be set.`);
      continue;
    }
    for (const trigger of triggers) {
      const variables = await cloudflare.listBuildVariableNames(accountId, trigger.uuid);
      if (!variables.includes(SITE_KEY_VARIABLE)) {
        problems.push(`${worker} trigger "${trigger.name}" has no ${SITE_KEY_VARIABLE} build variable.`);
      }
    }
  }
  return {
    problems,
    notes: [],
    fix: `Add ${SITE_KEY_VARIABLE} as a plain-text build variable under Settings → Build → Variables and secrets on each Worker (${DOCS}).`,
  };
}

async function checkProductionDeploy(
  ctx: ProviderContext,
  accountId: string,
  config: ContactConfig,
  worker: string,
): Promise<PartResult> {
  const { cloudflare } = ctx;
  const problems: string[] = [];

  const triggers = (await cloudflare.listBuildTriggers(accountId, worker)).filter((t) => !isNonProductionTrigger(t));
  if (triggers.length === 0) {
    problems.push(`${worker} has no production build trigger.`);
  } else if (triggers.some((t) => t.deployCommand !== PRODUCTION_DEPLOY_COMMAND)) {
    problems.push(`${worker}'s production deploy command is not "${PRODUCTION_DEPLOY_COMMAND}".`);
  }

  const databases = await cloudflare.listD1Databases(accountId);
  const database = databases.find((d) => d.name === config.production.name);
  if (!database) {
    problems.push(`The production database ${config.production.name} does not exist yet.`);
  } else {
    const applied = await cloudflare.listD1AppliedMigrations(accountId, database.uuid);
    const notApplied = unappliedMigrations(ctx, applied);
    if (notApplied.length > 0) problems.push(`${config.production.name} has not applied: ${notApplied.join(", ")}.`);
  }

  const crons = await cloudflare.listWorkerCrons(accountId, worker);
  if (!crons.includes(config.productionCron)) {
    problems.push(`${worker} has no Cron Trigger "${config.productionCron}" registered.`);
  }
  return {
    problems,
    notes: [],
    fix: `Set dcc-web's production deploy command to ${PRODUCTION_DEPLOY_COMMAND} (Settings → Build), then Retry the latest main build (${DOCS}).`,
  };
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  const config = readContactConfig(ctx);
  if (!config) return wranglerUnreadable(ITEM, SUMMARY);
  const names = workerNames(ctx);
  const { cloudflare } = ctx;

  try {
    const parts: Array<[string, PartResult]> = [
      ["Databases", await checkDatabases(cloudflare, access.accountId, config)],
      ["Turnstile widget", await checkWidget(cloudflare, access.accountId, names.preview)],
      ["Worker secrets", await checkSecrets(cloudflare, access.accountId, names)],
      ["Site key", await checkSiteKey(cloudflare, access.accountId, names)],
      ["Production deploy", await checkProductionDeploy(ctx, access.accountId, config, names.production)],
    ];

    const problems = parts.flatMap(([label, part]) => part.problems.map((line) => `${label}: ${line}`));
    const notes = parts.flatMap(([label, part]) => part.notes.map((line) => `${label}: ${line}`));
    const firstFailing = parts.find(([, part]) => part.problems.length > 0);
    if (firstFailing) {
      return missing(ITEM, "Some contact bindings are not in place.", firstFailing[1].fix, [...problems, ...notes]);
    }
    return complete(
      ITEM,
      `The contact databases, Turnstile widget, secrets, site key variable and production deploy are in place.`,
      notes,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → D1: Read, Turnstile Sites: Read, Workers Builds Configuration: Read and Workers Scripts: Read, then try again.",
    );
  }
}
