// checks/github-main-protection.ts (setup item 13, data-model.md
// "github-main-protection"): the active ruleset on main matches
// setup/github-ruleset.json, evaluated against the closed list of 10 rules in
// spec.md's Edge Cases ("Partially configured branch protection"); each gap
// is named individually, never lumped into one generic message.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-main-protection", order: 13 };
const RULESET_NAME = "main-protection";

interface RulesetSummary {
  id: number;
  name: string;
  target: string;
  enforcement: string;
}

interface RulesetRule {
  type: string;
  parameters?: Record<string, unknown>;
}

interface RefNameCondition {
  include?: string[];
  exclude?: string[];
}

interface RulesetConditions {
  ref_name?: RefNameCondition;
}

interface FullRuleset {
  id: number;
  name: string;
  target: string;
  enforcement: string;
  conditions?: RulesetConditions;
  rules: RulesetRule[];
  bypass_actors: unknown[];
}

/** True when the ruleset's ref_name condition includes refs/heads/main (or the
 * ~DEFAULT_BRANCH shorthand) and does not explicitly exclude it. */
function coversMain(actual: FullRuleset | null): boolean {
  const refName = actual?.conditions?.ref_name;
  if (!refName) return false;
  const include = refName.include ?? [];
  const exclude = refName.exclude ?? [];
  const included = include.includes("refs/heads/main") || include.includes("~DEFAULT_BRANCH");
  const excluded = exclude.includes("refs/heads/main");
  return included && !excluded;
}

function requiredContexts(rule: RulesetRule | undefined): string[] {
  const list = rule?.parameters?.required_status_checks as Array<{ context: string }> | undefined;
  return list?.map((c) => c.context) ?? [];
}

// GitHub Actions' app id: without the pin, any app could post a passing `verify` status.
const GITHUB_ACTIONS_APP_ID = 15368;

function verifyPinnedToActions(rule: RulesetRule | undefined): boolean {
  const list = rule?.parameters?.required_status_checks as
    | Array<{ context: string; integration_id?: number }>
    | undefined;
  return list?.some((c) => c.context === "verify" && c.integration_id === GITHUB_ACTIONS_APP_ID) ?? false;
}

// Evaluates the closed list of 10 rules from spec.md's "Partially configured
// branch protection" edge case against the actual ruleset (or its absence,
// when `actual` is null). Order matches the closed list in the spec.
function evaluateGaps(actual: FullRuleset | null): string[] {
  const gaps: string[] = [];
  if (actual?.enforcement !== "active" || !coversMain(actual)) gaps.push("protection active on main");

  const rules = actual?.rules ?? [];
  const pr = rules.find((r) => r.type === "pull_request");
  if (!pr) gaps.push("pull request required");
  if (!(Number(pr?.parameters?.required_approving_review_count ?? 0) >= 1)) gaps.push("one approving review required");
  if (pr?.parameters?.require_code_owner_review !== true) gaps.push("code-owner review required");
  if (pr?.parameters?.dismiss_stale_reviews_on_push !== true) gaps.push("stale approvals dismissed on new commits");

  const statusChecks = rules.find((r) => r.type === "required_status_checks");
  const contexts = requiredContexts(statusChecks);
  if (!contexts.includes("verify")) {
    gaps.push("required check verify");
  } else if (!verifyPinnedToActions(statusChecks)) {
    gaps.push("required check verify pinned to GitHub Actions");
  }
  if (statusChecks?.parameters?.strict_required_status_checks_policy !== true) {
    gaps.push("branch must be up to date before merging");
  }

  if (!rules.some((r) => r.type === "non_fast_forward")) gaps.push("force-pushes blocked");
  if (!rules.some((r) => r.type === "deletion")) gaps.push("deletion blocked");
  if ((actual?.bypass_actors?.length ?? 0) > 0) gaps.push("no bypass actors");

  return gaps;
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const list = await ctx.github.api<RulesetSummary[]>(`repos/${owner}/${repo}/rulesets`);
    const summary = list.find((r) => r.name === RULESET_NAME && r.target === "branch");

    let full: FullRuleset | null = null;
    if (summary) {
      full = await ctx.github.api<FullRuleset>(`repos/${owner}/${repo}/rulesets/${summary.id}`);
    }

    const gaps = evaluateGaps(full);
    if (gaps.length > 0) {
      return missing(
        ITEM,
        full ? "The active ruleset on main is missing some required rules." : "No active ruleset protects main yet.",
        "Import setup/github-ruleset.json as a repository ruleset on main: Settings → Rules → Rulesets → New branch ruleset → Import a ruleset.",
        gaps,
      );
    }

    return complete(ITEM, "The active ruleset on main matches setup/github-ruleset.json.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the repository's rulesets.",
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
