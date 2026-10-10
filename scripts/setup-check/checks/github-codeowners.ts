// checks/github-codeowners.ts (setup item 11, data-model.md
// "github-codeowners"): .github/CODEOWNERS on main has the catch-all line
// `* @drcdev`, so every approval that counts is Don's (constitution Principle
// III), and GitHub reports no CODEOWNERS errors for it (FR-014).
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-codeowners", order: 11 };

interface CodeownersErrorsResponse {
  errors: Array<{ line?: number; message?: string }>;
}

function hasCatchAll(codeowners: string): boolean {
  return codeowners.split("\n").some((l) => /^\*\s+@drcdev(\s|$)/.test(l.trim()));
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const codeowners = ctx.fs.readText(".github/CODEOWNERS");
  if (codeowners === null) {
    return missing(
      ITEM,
      ".github/CODEOWNERS does not exist.",
      "Confirm this slice's pull request, which adds .github/CODEOWNERS, has merged to main.",
    );
  }

  if (!hasCatchAll(codeowners)) {
    return missing(
      ITEM,
      "CODEOWNERS does not name @drcdev as the owner of every path.",
      "Add the line `* @drcdev` to .github/CODEOWNERS.",
    );
  }

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const result = await ctx.github.api<CodeownersErrorsResponse>(`repos/${owner}/${repo}/codeowners/errors`);
    if (result.errors.length > 0) {
      return missing(
        ITEM,
        "GitHub reports errors in .github/CODEOWNERS.",
        "Fix each reported error in .github/CODEOWNERS (for example an unrecognised owner) and push again.",
        result.errors.map((e) => `line ${e.line ?? "?"}: ${e.message ?? "unknown error"}`),
      );
    }
    return complete(ITEM, "CODEOWNERS makes @drcdev the owner of every path, with no errors reported by GitHub.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read GitHub's CODEOWNERS error report.",
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
