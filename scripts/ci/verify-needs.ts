/**
 * Decides whether the aggregate `verify` job passes, from the `needs` context of the jobs
 * it depends on. GitHub reports a skipped required job as success, so a skip is accepted
 * only where the skip-safe path expects it. Anything unexpected fails (fail closed).
 */

export interface NeedResult {
  result: string;
  outputs?: Record<string, string>;
}

export type Needs = Record<string, NeedResult>;

export interface NeedsDecision {
  pass: boolean;
  problems: string[];
}

const REQUIRED_JOBS = ["changes", "static", "build-tests", "e2e"] as const;
/** Jobs that are skipped, by design, when the changed-paths check says the gate is skip-safe. */
const SKIPPABLE_JOBS: readonly string[] = ["build-tests", "e2e"];

export function decide(needs: Needs): NeedsDecision {
  const problems: string[] = [];

  for (const job of REQUIRED_JOBS) {
    if (!Object.prototype.hasOwnProperty.call(needs, job) || typeof needs[job]?.result !== "string") {
      problems.push(`job "${job}" is missing from needs`);
    }
  }

  const changes = needs.changes;
  const full = changes?.outputs?.full;
  const fullKnown = full === "true" || full === "false";
  if (changes && changes.result !== "success") {
    problems.push(`job "changes" result is "${changes.result}", expected "success"`);
  } else if (changes && !fullKnown) {
    problems.push(`job "changes" output full is ${JSON.stringify(full)}, expected "true" or "false"`);
  }

  for (const job of REQUIRED_JOBS) {
    if (job === "changes") continue;
    const entry = needs[job];
    if (!entry || typeof entry.result !== "string") continue;
    if (entry.result === "success") continue;
    if (entry.result === "skipped" && SKIPPABLE_JOBS.includes(job) && full === "false") continue;
    problems.push(`job "${job}" result is "${entry.result}"`);
  }

  return { pass: problems.length === 0, problems };
}

/** Runs the decision against `env.NEEDS` and returns the process exit code. */
export function run(env: { NEEDS?: string | undefined }): number {
  let needs: unknown;
  try {
    needs = JSON.parse(env.NEEDS ?? "");
  } catch {
    console.error("NEEDS is not valid JSON");
    return 1;
  }
  if (typeof needs !== "object" || needs === null || Array.isArray(needs)) {
    console.error("NEEDS is not a JSON object");
    return 1;
  }
  const decision = decide(needs as Needs);
  for (const problem of decision.problems) console.error(problem);
  if (decision.pass) console.log("verify: all required jobs passed");
  return decision.pass ? 0 : 1;
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  process.exitCode = run(process.env);
}
