#!/usr/bin/env node
// scripts/deploy/preview.ts — `pnpm run deploy:preview`, the deploy command of the
// `dcc-web-preview` Workers Builds project (docs/setup.md item 10). Applies D1 migrations to
// the preview database, deploys the preview Worker, and on non-main branches uploads a Worker
// Version aliased with the same function astro.config.mjs uses to compute the build's `site`,
// so a preview build is reachable at the address its own metadata points to
// (specs/007-contact-form/contracts/worker-config.md, specs/002-site-foundation/contracts/site-origin.md).
import { previewAlias } from "../../src/lib/site-origin.ts";
import { assertWorkerName, runSteps } from "./run.ts";

export interface DeployPreviewEnv {
  WORKERS_CI_BRANCH?: string;
  WRANGLER_CI_OVERRIDE_NAME?: string;
}

const WORKER_NAME = "dcc-web-preview";

/**
 * The ordered Wrangler steps for a preview deploy. Throws a plain-language error, never
 * printing an environment value, when the Worker override is wrong, the branch is missing or
 * no alias can be derived from it.
 */
export function previewDeploySteps(env: DeployPreviewEnv): string[][] {
  assertWorkerName(env, WORKER_NAME);
  const branch = env.WORKERS_CI_BRANCH;
  if (!branch) {
    throw new Error(
      "WORKERS_CI_BRANCH is not set. deploy:preview only runs as Cloudflare Workers Builds' deploy command.",
    );
  }
  const steps = [
    ["d1", "migrations", "apply", "DB", "--remote", "--env", "preview"],
    ["deploy", "--env", "preview"],
  ];
  if (branch !== "main") {
    const alias = previewAlias(branch);
    if (!alias) {
      throw new Error("Could not derive a preview alias from the current branch name.");
    }
    steps.push(["versions", "upload", "--env", "preview", "--preview-alias", alias]);
  }
  return steps;
}

function main(): number {
  let steps: string[][];
  try {
    steps = previewDeploySteps(process.env);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
  return runSteps(steps);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}
