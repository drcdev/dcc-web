// checks/github-major-label.ts (setup item 13, data-model.md
// "github-major-label"): the major-change label exists and the repository
// allows auto-merge (FR-014). Per spec Edge Cases ("Sole maintainer
// approval"): "The setup check does not inspect individual pull requests" —
// an open pull request's author or labels have no effect on this item; the
// per-PR authorship rule is enforced separately by scripts/ci/major-change-gate.ts.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-major-label", order: 13 };
const LABEL_NAME = "major-change";

interface Label {
  name: string;
}

interface RepoSettings {
  allow_auto_merge?: boolean;
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const [labels, settings] = await Promise.all([
      ctx.github.api<Label[]>(`repos/${owner}/${repo}/labels`),
      ctx.github.api<RepoSettings>(`repos/${owner}/${repo}`),
    ]);

    const hasLabel = labels.some((label) => label.name === LABEL_NAME);
    const autoMergeOn = settings.allow_auto_merge === true;

    const problems: string[] = [];
    if (!hasLabel) problems.push(`the "${LABEL_NAME}" label does not exist`);
    if (!autoMergeOn) problems.push("auto-merge is not allowed for this repository");

    if (problems.length > 0) {
      return missing(
        ITEM,
        `Major-change marking is not fully set up: ${problems.join("; ")}.`,
        `Repository → Labels → create ${LABEL_NAME}. Repository Settings → General → turn on Allow auto-merge.`,
        problems,
      );
    }

    return complete(ITEM, `The "${LABEL_NAME}" label exists and the repository allows auto-merge.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the repository's labels or settings.",
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
