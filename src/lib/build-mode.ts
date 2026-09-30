// Which builds include draft posts (data-model.md "BuildMode"; research R3;
// FR-032, FR-046). Production is exactly a Cloudflare Workers Builds build of
// `main`, the same signal src/lib/site-origin.ts and scripts/deploy/preview.ts
// already use. Every other build (branch previews, `astro dev`, local builds,
// the GitHub Actions run, the Playwright servers) includes drafts.

export interface BuildEnv {
  WORKERS_CI?: string | undefined;
  WORKERS_CI_BRANCH?: string | undefined;
}

/**
 * Whether draft posts belong in this build. Fails safe: a Workers Builds build whose branch
 * cannot be read counts as production, so drafts are left out.
 */
export function includeDrafts(env: BuildEnv): boolean {
  if (env.WORKERS_CI !== "1") return true;
  const branch = env.WORKERS_CI_BRANCH?.trim();
  if (!branch) return false;
  return branch !== "main";
}
