// scripts/deploy/run.ts — shared step runner for deploy:preview and deploy:production.
// Runs each Wrangler step in order, stops at the first failure, and passes stdio through to
// Wrangler only. Never prints an environment value (specs/007-contact-form/contracts/worker-config.md).
import { spawnSync } from "node:child_process";

/**
 * Throws a plain-language error when Workers Builds was pointed at the wrong Worker.
 * `WRANGLER_CI_OVERRIDE_NAME` unset is fine; a value other than `expected` is refused
 * without echoing the value.
 */
export function assertWorkerName(env: { WRANGLER_CI_OVERRIDE_NAME?: string }, expected: string): void {
  const override = env.WRANGLER_CI_OVERRIDE_NAME;
  if (override !== undefined && override !== "" && override !== expected) {
    throw new Error(
      `WRANGLER_CI_OVERRIDE_NAME does not match this deploy script, which is for the ${expected} Worker. ` +
        "Check which Worker's Workers Builds settings run it.",
    );
  }
}

/** Runs each Wrangler step in turn; returns the exit code of the first failing step, or 0. */
export function runSteps(steps: string[][]): number {
  for (const args of steps) {
    const result = spawnSync("pnpm", ["exec", "wrangler", ...args], { stdio: "inherit" });
    if (result.error) {
      process.stderr.write(`${result.error.message}\n`);
      return 1;
    }
    if (result.status !== 0) {
      process.stderr.write(`Step failed: wrangler ${args.slice(0, 2).join(" ")}. Stopping.\n`);
      return result.status ?? 1;
    }
  }
  return 0;
}
