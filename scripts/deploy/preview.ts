#!/usr/bin/env node
// scripts/deploy/preview.ts — `pnpm run deploy:preview`, the non-production
// branch deploy command Cloudflare Workers Builds runs for every branch other
// than `main` (docs/setup.md item 10). Uploads a Worker Versions preview
// aliased with the same function astro.config.mjs uses to compute the build's
// `site`, so a preview build is always reachable at the address its own
// metadata (canonical, og:url, sitemap) points to
// (specs/002-site-foundation/contracts/site-origin.md).
import { spawnSync } from "node:child_process";
import { previewAlias } from "../../src/lib/site-origin.ts";

export interface DeployPreviewEnv {
  WORKERS_CI_BRANCH?: string;
}

/**
 * Builds the `wrangler` arguments for the aliased preview upload. Throws a
 * plain-language error — never prints an environment value — when the branch
 * is missing, is `main` (production deploys with `wrangler deploy` instead),
 * or cannot produce a usable alias.
 */
export function previewUploadArgs(env: DeployPreviewEnv): string[] {
  const branch = env.WORKERS_CI_BRANCH;
  if (!branch) {
    throw new Error(
      "WORKERS_CI_BRANCH is not set. deploy:preview only runs as Cloudflare Workers Builds' " +
        "non-production branch deploy command.",
    );
  }
  if (branch === "main") {
    throw new Error(
      "deploy:preview is for non-production branches only; main deploys with `wrangler deploy`.",
    );
  }
  const alias = previewAlias(branch);
  if (!alias) {
    throw new Error(`Could not derive a preview alias from the current branch name.`);
  }
  return ["versions", "upload", "--preview-alias", alias];
}

function main(): number {
  let args: string[];
  try {
    args = previewUploadArgs(process.env);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }

  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], { stdio: "inherit" });
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    return 1;
  }
  return result.status ?? 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}
