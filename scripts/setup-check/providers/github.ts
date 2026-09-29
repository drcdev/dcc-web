// Read-only GitHub provider: runs `gh api` (GET only) through
// node:child_process.execFile so it uses `gh`'s own sign-in — no token
// handling in this codebase. The module never constructs a call with a
// mutating flag (-X, --method, -f, -F, --field, --raw-field, --input); the
// default executor's args array is always exactly ["api", <path>].
import { execFile } from "node:child_process";
import { ProviderAccessError, type GitHubReader } from "../types.ts";
import { redact } from "../redact.ts";

const GITHUB_TIMEOUT_MS = 10_000;

export interface GitHubExecOptions {
  timeoutMs: number;
  env: NodeJS.ProcessEnv;
}

export type GitHubExecer = (args: string[], options: GitHubExecOptions) => Promise<{ stdout: string }>;

function sanitizedEnv(): NodeJS.ProcessEnv {
  // Never run gh in a verbose or debug mode (FR-024): these can echo request
  // headers, which can carry the sign-in token.
  const env = { ...process.env };
  delete env.GH_DEBUG;
  delete env.DEBUG;
  return env;
}

function defaultExecer(args: string[], options: GitHubExecOptions): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { timeout: options.timeoutMs, env: options.env }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stderr: stderr || error.message }));
        return;
      }
      resolve({ stdout });
    });
  });
}

export function classifyGhError(err: unknown): ProviderAccessError {
  const e = err as (NodeJS.ErrnoException & { stderr?: string; killed?: boolean; signal?: string }) | undefined;
  const stderr = typeof e?.stderr === "string" ? e.stderr : "";
  const message = redact(stderr || (e instanceof Error ? e.message : String(err)));

  if (e?.killed || e?.signal === "SIGTERM" || e?.code === "ETIMEDOUT") {
    return new ProviderAccessError("gh api call timed out after 10 seconds");
  }
  if (/not logged in|auth login|no oauth token/i.test(message)) {
    return new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
  }
  if (/http\s*404/i.test(message)) {
    return new ProviderAccessError("gh api reported 404 (resource not found or no read access)");
  }
  if (/http\s*40[13]|forbidden|bad credentials/i.test(message)) {
    return new ProviderAccessError("gh api access denied (401/403); check the signed-in account's permissions");
  }
  return new ProviderAccessError(`gh api call failed: ${message}`);
}

export function createGitHubReader(execer: GitHubExecer = defaultExecer): GitHubReader {
  return {
    async api<T = unknown>(path: string): Promise<T> {
      const args = ["api", path];
      try {
        const { stdout } = await execer(args, { timeoutMs: GITHUB_TIMEOUT_MS, env: sanitizedEnv() });
        return JSON.parse(stdout) as T;
      } catch (err) {
        throw classifyGhError(err);
      }
    },
    async authStatus(): Promise<{ signedIn: boolean; login: string | null }> {
      try {
        const { stdout } = await execer(["auth", "status"], {
          timeoutMs: GITHUB_TIMEOUT_MS,
          env: sanitizedEnv(),
        });
        const match = stdout.match(/Logged in to [^\s]+ account (\S+)/);
        return { signedIn: true, login: match ? match[1]! : null };
      } catch (err) {
        const classified = classifyGhError(err);
        if (/not signed in/i.test(classified.reason)) {
          return { signedIn: false, login: null };
        }
        throw classified;
      }
    },
  };
}
