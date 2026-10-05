// checks/github-main-protection.ts (setup item 14, data-model.md
// "github-main-protection"): the active ruleset on main matches
// setup/github-ruleset.json, read from the repository and diffed against the
// live ruleset; each gap is named individually, never lumped into one generic
// message.
import type { ParsedGithubRuleset } from "../schemas.ts";
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-main-protection", order: 14 };
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
  bypass_actors?: unknown[];
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

interface StatusCheck {
  context: string;
  integration_id?: number;
}

function requiredChecks(rule: RulesetRule | undefined): StatusCheck[] {
  return (rule?.parameters?.required_status_checks as StatusCheck[] | undefined) ?? [];
}

/** Friendly gap names for the pull_request parameters worth naming; any other
 * differing parameter is reported by its key. */
const PULL_REQUEST_GAP_NAMES: Record<string, string> = {
  required_approving_review_count: "one approving review required",
  dismiss_stale_reviews_on_push: "stale approvals dismissed on new commits",
  allowed_merge_methods: "merge commits only",
};

// Diffs the live ruleset (or its absence, when `actual` is null) against the
// committed setup/github-ruleset.json, naming each gap individually. Order:
// branch coverage, pull request, required checks, force-push, deletion, bypass.
export function evaluateGaps(expected: ParsedGithubRuleset, actual: FullRuleset | null): string[] {
  const gaps: string[] = [];
  if (actual?.enforcement !== "active" || !coversMain(actual)) gaps.push("protection active on main");

  const rules = actual?.rules ?? [];
  const expectedPr = expected.rules.find((r) => r.type === "pull_request");
  const pr = rules.find((r) => r.type === "pull_request");
  if (!pr) {
    gaps.push("pull request required");
  } else if (expectedPr?.type === "pull_request") {
    for (const [key, want] of Object.entries(expectedPr.parameters)) {
      if (JSON.stringify(pr.parameters?.[key]) === JSON.stringify(want)) continue;
      gaps.push(PULL_REQUEST_GAP_NAMES[key] ?? `pull request setting ${key} differs`);
    }
  }

  const expectedStatus = expected.rules.find((r) => r.type === "required_status_checks");
  const statusChecks = rules.find((r) => r.type === "required_status_checks");
  const wantChecks = expectedStatus?.type === "required_status_checks" ? expectedStatus.parameters.required_status_checks : [];
  const liveChecks = requiredChecks(statusChecks);
  for (const want of wantChecks) {
    const found = liveChecks.some(
      (c) => c.context === want.context && (want.integration_id === undefined || c.integration_id === want.integration_id),
    );
    if (!found) gaps.push(`required check ${want.context}`);
  }
  const wantStrict =
    expectedStatus?.type === "required_status_checks" ? expectedStatus.parameters.strict_required_status_checks_policy : true;
  if (statusChecks?.parameters?.strict_required_status_checks_policy !== wantStrict) {
    gaps.push("branch must be up to date before merging");
  }
  for (const live of liveChecks) {
    if (!wantChecks.some((w) => w.context === live.context)) gaps.push(`unexpected required check ${live.context}`);
  }

  if (!rules.some((r) => r.type === "non_fast_forward")) gaps.push("force-pushes blocked");
  if (!rules.some((r) => r.type === "deletion")) gaps.push("deletion blocked");
  // GITHUB_TOKEN readers do not see bypass_actors; an absent field is "not visible", not a gap.
  if (actual?.bypass_actors !== undefined && actual.bypass_actors.length > 0) gaps.push("no bypass actors");

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

    const expected = ctx.fs.readJson<ParsedGithubRuleset>("setup/github-ruleset.json");
    if (!expected) {
      return couldNotCheck(
        ITEM,
        "Could not read setup/github-ruleset.json.",
        "setup/github-ruleset.json is missing or is not valid JSON.",
        "Restore setup/github-ruleset.json from git, then try again.",
      );
    }

    const gaps = evaluateGaps(expected, full);
    if (gaps.length > 0) {
      return missing(
        ITEM,
        full ? "The active ruleset on main is missing some required rules." : "No active ruleset protects main yet.",
        "Import setup/github-ruleset.json as the repository ruleset on main: PUT repos/drcdev/dcc-web/rulesets/<id> with the file as the body to update the existing one, or POST to repos/drcdev/dcc-web/rulesets if none exists.",
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
