// checks/pipeline-secrets.ts (setup item 15, data-model.md
// "pipeline-secrets"): GitHub Actions secret and variable names equal the
// manifest's store: "github-actions" entries (currently none) — no extras,
// none missing (FR-021; spec Edge Cases "Secret names drift").
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { secretManifest } from "../secrets.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "pipeline-secrets", order: 15 };

interface ActionsSecretsResponse {
  secrets: Array<{ name: string }>;
}

interface ActionsVariablesResponse {
  variables: Array<{ name: string }>;
}

function expectedNames(kind: "secret" | "variable"): string[] {
  return secretManifest.filter((s) => s.store === "github-actions" && s.kind === kind).map((s) => s.name);
}

function diffNames(expected: string[], actual: string[]): { missingNames: string[]; extraNames: string[] } {
  return {
    missingNames: expected.filter((name) => !actual.includes(name)),
    extraNames: actual.filter((name) => !expected.includes(name)),
  };
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const owner = config?.owner ?? "drcdev";
  const repo = config?.repo ?? "dcc-web";

  try {
    const [secretsResponse, variablesResponse] = await Promise.all([
      ctx.github.api<ActionsSecretsResponse>(`repos/${owner}/${repo}/actions/secrets`),
      ctx.github.api<ActionsVariablesResponse>(`repos/${owner}/${repo}/actions/variables`),
    ]);

    const secretsDiff = diffNames(
      expectedNames("secret"),
      secretsResponse.secrets.map((s) => s.name),
    );
    const variablesDiff = diffNames(
      expectedNames("variable"),
      variablesResponse.variables.map((v) => v.name),
    );

    const details = [
      ...secretsDiff.missingNames.map((n) => `missing secret: ${n}`),
      ...secretsDiff.extraNames.map((n) => `extra secret: ${n}`),
      ...variablesDiff.missingNames.map((n) => `missing variable: ${n}`),
      ...variablesDiff.extraNames.map((n) => `extra variable: ${n}`),
    ];

    if (details.length > 0) {
      return missing(
        ITEM,
        "GitHub Actions secret and variable names do not match what this slice documents.",
        "Add any missing name and remove any extra one in repository Settings → Secrets and variables → Actions, or update the manifest if the pipeline's needs have changed.",
        details,
      );
    }

    return complete(ITEM, "GitHub Actions has exactly the secret and variable names this slice documents (none).");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read the repository's Actions secrets and variables.",
      err,
      "Run gh auth status to confirm the sign-in, then try again.",
    );
  }
}
