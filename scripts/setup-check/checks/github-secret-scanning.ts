// checks/github-secret-scanning.ts (setup item 9, data-model.md
// "github-secret-scanning"): security_and_analysis.secret_scanning and
// …secret_scanning_push_protection are both enabled for the repository.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-secret-scanning", order: 9 };

interface RepoSettings {
  security_and_analysis?: {
    secret_scanning?: { status?: string };
    secret_scanning_push_protection?: { status?: string };
  };
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const settings = await ctx.github.api<RepoSettings>(`repos/${owner}/${repo}`);
    const scanning = settings.security_and_analysis?.secret_scanning?.status;
    const pushProtection = settings.security_and_analysis?.secret_scanning_push_protection?.status;

    const off: string[] = [];
    if (scanning !== "enabled") off.push("secret scanning");
    if (pushProtection !== "enabled") off.push("push protection");

    if (off.length > 0) {
      return missing(
        ITEM,
        `GitHub ${off.join(" and ")} ${off.length > 1 ? "are" : "is"} not enabled for this repository.`,
        "Turn on Secret scanning and Push protection: Repository Settings → Code security.",
      );
    }

    return complete(ITEM, "GitHub secret scanning and push protection are both enabled.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the repository's secret-scanning settings.",
      err,
      "Run gh auth status to confirm the sign-in and its access to repository settings, then try again.",
    );
  }
}
