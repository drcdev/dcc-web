// checks/github-machine-account.ts (setup item 7, data-model.md
// "github-machine-account"): the machine account (setup/config.json's
// machineAccount, "drc-agents") is a repository collaborator with write or
// maintain permission, never admin (FR-013).
//
// GitHub's real response shape for GET .../collaborators/{username}/permission
// has no top-level `permissions` field. It is:
//   { permission: "admin"|"write"|"read"|"none",
//     role_name: "admin"|"maintain"|"write"|"triage"|"read"|...,
//     user: { login, ..., permissions: { admin, maintain, push, triage, pull } } }
// `role_name` is preferred (it reflects custom repository roles too); the
// legacy boolean `user.permissions` map is used only as a fallback when
// `role_name` is absent.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { ProviderAccessError } from "../types.ts";
import { complete, fromProviderError, missing, pending } from "./shared.ts";

const ITEM = { id: "github-machine-account", order: 7 };

interface CollaboratorPermission {
  permission?: string;
  role_name?: string;
  user?: {
    login?: string;
    permissions?: { admin?: boolean; maintain?: boolean; push?: boolean; triage?: boolean; pull?: boolean };
  };
}

interface RepoInvitation {
  invitee?: { login?: string };
  permissions?: string;
}

type AccessLevel = "admin" | "write-or-better" | "below-write";

/** Classifies the collaborator's access from role_name, falling back to the legacy booleans. */
function classify(result: CollaboratorPermission): AccessLevel {
  const roleName = result.role_name;
  if (roleName) {
    if (roleName === "admin") return "admin";
    if (roleName === "maintain" || roleName === "write") return "write-or-better";
    return "below-write";
  }
  const perms = result.user?.permissions ?? {};
  if (perms.admin) return "admin";
  if (perms.maintain || perms.push) return "write-or-better";
  return "below-write";
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
    const level = classify(result);
    const roleName = result.role_name ?? (result.user?.permissions?.maintain ? "maintain" : "write");

    if (level === "admin") {
      return missing(
        ITEM,
        `${account}'s collaborator permission is admin.`,
        `Lower ${account}'s permission to write or maintain (never admin) in repository Settings → Collaborators.`,
      );
    }
    if (level === "write-or-better") {
      return complete(ITEM, `${account}'s collaborator permission is ${roleName}.`);
    }

    // Below write: check for an outstanding invitation before reporting missing,
    // since an accepted-but-not-yet-synced or still-pending invite should not
    // read as "not a collaborator".
    const invitations = await ctx.github.api<RepoInvitation[]>(`repos/${owner}/${repo}/invitations`);
    const invite = invitations.find((inv) => inv.invitee?.login?.toLowerCase() === account.toLowerCase());
    if (invite) {
      return pending(
        ITEM,
        `${account} has a pending invitation to ${owner}/${repo}.`,
        `Accept the invitation as ${account}.`,
      );
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
