#!/usr/bin/env node
// scripts/deploy/production.ts — `pnpm run deploy:production`, the deploy command of the
// `dcc-web` Workers Builds project (docs/setup.md item 10). Applies D1 migrations to the
// production database, then deploys the production Worker. Refuses to run off `main` or when
// pointed at another Worker (specs/007-contact-form/contracts/worker-config.md).
import { assertWorkerName, runSteps } from "./run.ts";

export interface DeployProductionEnv {
  WORKERS_CI_BRANCH?: string;
  WRANGLER_CI_OVERRIDE_NAME?: string;
}

const WORKER_NAME = "dcc-web";

/** The ordered Wrangler steps for a production deploy. Throws when the environment is wrong. */
export function productionDeploySteps(env: DeployProductionEnv): string[][] {
  assertWorkerName(env, WORKER_NAME);
  if (env.WORKERS_CI_BRANCH !== "main") {
    throw new Error("deploy:production only runs for the main branch; other branches deploy with deploy:preview.");
  }
  return [["d1", "migrations", "apply", "DB", "--remote"], ["deploy"]];
}

function main(): number {
  let steps: string[][];
  try {
    steps = productionDeploySteps(process.env);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
  return runSteps(steps);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}
