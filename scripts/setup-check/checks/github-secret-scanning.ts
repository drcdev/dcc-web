// checks/github-secret-scanning.ts (setup item 8, data-model.md
// "github-secret-scanning"): security_and_analysis.secret_scanning and
// …secret_scanning_push_protection and …dependabot_security_updates are all enabled for the
// repository. GitHub only lets security updates be on while Dependabot alerts are on, so
// "enabled" here also covers alerts.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-secret-scanning", order: 8 };

interface RepoSettings {
  security_and_analysis?: {
    secret_scanning?: { status?: string };
    secret_scanning_push_protection?: { status?: string };
    dependabot_security_updates?: { status?: string };
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

    const dependabot = settings.security_and_analysis?.dependabot_security_updates?.status;

    const off: string[] = [];
    if (scanning !== "enabled") off.push("secret scanning");
    if (pushProtection !== "enabled") off.push("push protection");
    if (dependabot !== "enabled") off.push("Dependabot security updates");

    if (off.length > 0) {
      return missing(
        ITEM,
        `GitHub ${off.join(", ").replace(/, ([^,]*)$/, " and $1")} ${off.length > 1 ? "are" : "is"} not enabled for this repository.`,
        "Turn on Secret scanning, Push protection and Dependabot security updates: Repository Settings → Code security.",
      );
    }

    return complete(ITEM, "GitHub secret scanning, push protection and Dependabot security updates are all enabled.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the repository's secret-scanning settings.",
      err,
      "Run gh auth status to confirm the sign-in and its access to repository settings, then try again.",
    );
  }
}
