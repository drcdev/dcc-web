// checks/github-codeowners.ts (setup item 12, data-model.md
// "github-codeowners"): .github/CODEOWNERS on main names @drcdev for every
// major path, and GitHub reports no CODEOWNERS errors for it (FR-014). The
// major-path list mirrors tests/unit/setup/drift.test.ts "CODEOWNERS covers
// every major-path item" (constitution Principle III / contracts/ci-and-gates.md).
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "github-codeowners", order: 12 };

const MAJOR_PATHS = [
  "/.github/",
  "/package.json",
  "/pnpm-lock.yaml",
  "/.nvmrc",
  "/wrangler.jsonc",
  "/astro.config.mjs",
  "/public/_headers",
  "/scripts/ci/",
  "/setup/",
  "/.specify/memory/constitution.md",
  "/.github/CODEOWNERS",
];

interface CodeownersErrorsResponse {
  errors: Array<{ line?: number; message?: string }>;
}

function missingMajorPaths(codeowners: string): string[] {
  const lines = codeowners.split("\n");
  return MAJOR_PATHS.filter((path) => {
    const line = lines.find((l) => l.trim().startsWith(path));
    return !line || !line.includes("@drcdev");
  });
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

  const gaps = missingMajorPaths(codeowners);
  if (gaps.length > 0) {
    return missing(
      ITEM,
      "CODEOWNERS does not name @drcdev for every major path.",
      "Add @drcdev as the owner for each major path in .github/CODEOWNERS.",
      gaps,
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
    return complete(ITEM, "CODEOWNERS names @drcdev for every major path, with no errors reported by GitHub.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read GitHub's CODEOWNERS error report.",
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
