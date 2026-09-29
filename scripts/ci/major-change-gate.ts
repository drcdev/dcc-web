/**
 * Decides whether a pull request is allowed to merge under the major-change
 * label rule (constitution Principle III, spec FR-014, plan research R9).
 *
 * `decide` is a pure function so it can be unit-tested without a network
 * call; the CLI below wires it to `gh api`-shaped JSON so the
 * `major-change-approval` GitHub Actions job can call it directly.
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

  console.log(decision.message);
  process.exit(decision.pass ? 0 : 1);
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
