// checks/local-tools.ts (setup item 1, data-model.md "local-tools"): Node 24 or
// later and the pinned package manager version are installed, and the GitHub
// CLI is signed in as Don. Node/pnpm versions are read from the
// npm_config_user_agent variable pnpm itself sets on every `pnpm run …`
// invocation (e.g. "pnpm/11.15.1 npm/? node/v24.4.1 darwin arm64"), via the
// existing EnvReader — this setup check is always run through `pnpm
// setup:check`, so this reflects the exact runtime that ran it, without
// needing a new provider or a debug/verbose tool invocation (FR-024).
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "local-tools", order: 1 };
const MIN_NODE_MAJOR = 24;

interface RuntimeVersions {
  nodeVersion: string;
  pnpmVersion: string;
}

export function parseUserAgent(userAgent: string): RuntimeVersions | null {
  const pnpmMatch = userAgent.match(/pnpm\/(\S+)/);
  const nodeMatch = userAgent.match(/node\/v?(\S+)/);
  if (!pnpmMatch || !nodeMatch) return null;
  return { pnpmVersion: pnpmMatch[1]!, nodeVersion: nodeMatch[1]! };
}

export function nodeMajor(version: string): number {
  return Number.parseInt(version.split(".")[0] ?? "0", 10);
}

/** The pnpm version pinned by package.json's `packageManager` field (e.g. "pnpm@11.15.1" -> "11.15.1"). */
export function pinnedPnpmVersion(packageManager: unknown): string | null {
  if (typeof packageManager !== "string") return null;
  const match = packageManager.match(/^pnpm@(.+)$/);
  return match ? match[1]! : null;
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const userAgent = ctx.env.get("npm_config_user_agent");
  const versions = userAgent ? parseUserAgent(userAgent) : null;
  if (!versions) {
    return couldNotCheck(
      ITEM,
      "Could not detect the Node and pnpm versions used to run this check.",
      "npm_config_user_agent is not set or could not be parsed.",
      "Run this check with pnpm setup:check (not node directly), so pnpm reports the active Node and pnpm versions.",
    );
  }

  if (nodeMajor(versions.nodeVersion) < MIN_NODE_MAJOR) {
    return missing(
      ITEM,
      `Node ${versions.nodeVersion} is active; Node ${MIN_NODE_MAJOR} or later is required.`,
      `Switch to Node ${MIN_NODE_MAJOR}: nvm install ${MIN_NODE_MAJOR} && nvm use ${MIN_NODE_MAJOR}, then run pnpm setup:check again.`,
    );
  }

  const pkg = ctx.fs.readJson<{ packageManager?: string }>("package.json");
  const pinned = pinnedPnpmVersion(pkg?.packageManager);
  if (pinned && pinned !== versions.pnpmVersion) {
    return missing(
      ITEM,
      `pnpm ${versions.pnpmVersion} is active; package.json pins pnpm ${pinned}.`,
      `Install the pinned pnpm version (corepack enable && corepack prepare pnpm@${pinned} --activate), then run pnpm setup:check again.`,
    );
  }

  try {
    const auth = await ctx.github.authStatus();
    if (!auth.signedIn) {
      return missing(
        ITEM,
        "The GitHub CLI (gh) is not signed in.",
        "Run gh auth login, then run pnpm setup:check --item local-tools again.",
      );
    }
    const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
    const owner = config?.owner;
    if (owner && auth.login !== owner) {
      return missing(
        ITEM,
        `gh is signed in as ${auth.login ?? "an unknown account"}, not ${owner}.`,
        `Run gh auth switch (or gh auth login) to sign in as ${owner}, then try again.`,
      );
    }
    return complete(
      ITEM,
      `Node ${versions.nodeVersion} and pnpm ${versions.pnpmVersion} are installed; gh is signed in as ${auth.login ?? owner ?? "Don"}.`,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not confirm the GitHub CLI sign-in.",
      err,
      "Run gh auth status to see what is wrong, fix it, then try again.",
    );
  }
}
