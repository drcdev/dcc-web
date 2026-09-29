/**
 * Decides whether a pull request is allowed to merge under the major-change
 * label rule (constitution Principle III, spec FR-014, plan research R9).
 *
 * `decide` is a pure function so it can be unit-tested without a network
 * call; the CLI below wires it to `gh api`-shaped JSON. The verdict is published
 * as a commit status (context `major-change-approval`) on the PR head SHA, not as
 * the job result: statuses are keyed by (sha, context), so a later approval
 * supersedes the earlier pending status instead of leaving a stale failed check run.
 */

export interface MajorGateReview {
  user: string;
  state: string;
  commitId: string;
  submittedAt: string;
}

export interface MajorGateInput {
  labels: string[];
  author: string;
  headSha: string;
  reviews: MajorGateReview[];
  owner: "drcdev";
  /** The dedicated GitHub machine account name, read from setup/config.json's `machineAccount`. */
  machineAccount: string;
}

export interface MajorGateDecision {
  pass: boolean;
  message: string;
}

const MAJOR_CHANGE_LABEL = "major-change";

export function decide(input: MajorGateInput): MajorGateDecision {
  if (!input.labels.includes(MAJOR_CHANGE_LABEL)) {
    return { pass: true, message: "No major-change label; nothing to approve." };
  }

  if (input.author === input.owner) {
    return {
      pass: false,
      message: `Don's approval will not count on his own pull request; reopen this change from ${input.machineAccount} so his review can approve it.`,
    };
  }

  const ownersReviews = input.reviews
    .filter((review) => review.user === input.owner)
    .sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt));
  const latestOwnerReview = ownersReviews.at(-1);

  const approved =
    latestOwnerReview?.state === "APPROVED" && latestOwnerReview.commitId === input.headSha;

  if (approved) {
    return {
      pass: true,
      message: "Don approved the current commit after viewing the preview.",
    };
  }

  return {
    pass: false,
    message: "Waiting for Don's approval after he views the preview.",
  };
}

/** The commit status context that the `main` ruleset requires. */
export const STATUS_CONTEXT = "major-change-approval";

const STATUS_DESCRIPTION_LIMIT = 140;

export interface CommitStatus {
  state: "success" | "pending";
  context: typeof STATUS_CONTEXT;
  description: string;
  target_url?: string;
}

export function toCommitStatus(decision: MajorGateDecision, targetUrl?: string): CommitStatus {
  const status: CommitStatus = {
    state: decision.pass ? "success" : "pending",
    context: STATUS_CONTEXT,
    description: decision.message.slice(0, STATUS_DESCRIPTION_LIMIT),
  };
  if (targetUrl) {
    status.target_url = targetUrl;
  }
  return status;
}

export function statusApiArgs(repo: string, sha: string, status: CommitStatus): string[] {
  const args = [
    "api",
    "-X",
    "POST",
    `repos/${repo}/statuses/${sha}`,
    "-f",
    `state=${status.state}`,
    "-f",
    `context=${status.context}`,
    "-f",
    `description=${status.description}`,
  ];
  if (status.target_url) {
    args.push("-f", `target_url=${status.target_url}`);
  }
  return args;
}

interface GhApiPullRequest {
  labels: { name: string }[];
  user: { login: string };
  head: { sha: string };
}

interface GhApiReview {
  user: { login: string };
  state: string;
  commit_id: string;
  submitted_at: string;
}

interface SetupConfig {
  machineAccount: string;
}

async function main(): Promise<void> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const execFileAsync = promisify(execFile);

  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  if (!repo || !prNumber) {
    console.error("GITHUB_REPOSITORY and PR_NUMBER environment variables are required.");
    process.exit(2);
  }

  const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
  const config = JSON.parse(readFileSync(`${repoRoot}setup/config.json`, "utf-8")) as SetupConfig;

  const [{ stdout: prJson }, { stdout: reviewsJson }] = await Promise.all([
    execFileAsync("gh", ["api", `repos/${repo}/pulls/${prNumber}`]),
    execFileAsync("gh", ["api", `repos/${repo}/pulls/${prNumber}/reviews`]),
  ]);

  const pr = JSON.parse(prJson) as GhApiPullRequest;
  const reviews = JSON.parse(reviewsJson) as GhApiReview[];

  const decision = decide({
    labels: pr.labels.map((label) => label.name),
    author: pr.user.login,
    headSha: pr.head.sha,
    owner: "drcdev",
    machineAccount: config.machineAccount,
    reviews: reviews.map((review) => ({
      user: review.user.login,
      state: review.state,
      commitId: review.commit_id,
      submittedAt: review.submitted_at,
    })),
  });

  const status = toCommitStatus(decision, process.env.RUN_URL || undefined);
  await execFileAsync("gh", statusApiArgs(repo, pr.head.sha, status));

  console.log(`${status.state}: ${decision.message}`);
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
