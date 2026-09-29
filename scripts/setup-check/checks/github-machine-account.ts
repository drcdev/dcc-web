// checks/github-machine-account.ts (setup item 8, data-model.md
// "github-machine-account"): the machine account (setup/config.json's
// machineAccount, "drc-agents") is a repository collaborator with write or
// maintain permission, never admin (FR-013).
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { ProviderAccessError } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-machine-account", order: 8 };

interface CollaboratorPermission {
  login?: string;
  permissions?: { admin?: boolean; maintain?: boolean; push?: boolean; pull?: boolean };
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";
  const account = config?.machineAccount ?? "drc-agents";

  try {
    const result = await ctx.github.api<CollaboratorPermission>(
      `repos/${owner}/${repo}/collaborators/${account}/permission`,
    );
    const perms = result.permissions ?? {};

    if (perms.admin) {
      return missing(
        ITEM,
        `${account}'s collaborator permission is admin.`,
        `Lower ${account}'s permission to write or maintain (never admin) in repository Settings → Collaborators.`,
      );
    }
    if (perms.push || perms.maintain) {
      return complete(ITEM, `${account}'s collaborator permission is ${perms.maintain ? "maintain" : "write"}.`);
    }
    return missing(
      ITEM,
      `${account}'s collaborator permission is below write.`,
      `Give ${account} write (or maintain) permission in repository Settings → Collaborators.`,
    );
  } catch (err) {
    if (err instanceof ProviderAccessError && /404/.test(err.reason)) {
      return missing(
        ITEM,
        `${account} is not a collaborator on ${owner}/${repo} yet.`,
        `Create the ${account} GitHub account and add it as a collaborator with write permission.`,
      );
    }
    return fromProviderError(
      ITEM,
      `Could not read ${account}'s collaborator permission.`,
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
