#!/usr/bin/env node
// CI step `node scripts/site-check/preview.ts`. Waits for the
// `Workers Builds: dcc-web-preview` check run on the pull request's head commit, then crawls the
// preview's sitemap and internal links with --expect-noindex. Fails closed: a failed, cancelled or
// missing preview build never passes.
import { appendFileSync, readFileSync } from "node:fs";
import { previewAlias } from "../../src/lib/site-origin.ts";
import { crawl, formatFailures, type CrawlResult, type FetchResult } from "./crawl.ts";

export const CHECK_NAME = "Workers Builds: dcc-web-preview";
export const POLL_MS = 20_000;
export const TIMEOUT_MS = 20 * 60_000;

export interface CheckRun {
  status: string;
  conclusion: string | null;
  details_url: string;
}

export interface PreviewDeps {
  getCheckRuns: () => Promise<CheckRun[]>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  sha: string;
}

export async function waitForPreview(deps: PreviewDeps): Promise<void> {
  const start = deps.now();
  for (;;) {
    const runs = await deps.getCheckRuns();
    const run = runs.find((r) => r.status === "completed") ?? runs[0];
    if (run && run.status === "completed") {
      if (run.conclusion === "success") return;
      throw new Error(
        `The preview build for ${deps.sha} finished as ${run.conclusion ?? "unknown"}; see ${run.details_url}.`,
      );
    }
    if (deps.now() - start >= TIMEOUT_MS) {
      throw new Error(
        `No "${CHECK_NAME}" check run appeared for ${deps.sha} within 20 minutes. Re-run this job once the preview build has reported.`,
      );
    }
    await deps.sleep(POLL_MS);
  }
}

export function previewOrigin(
  env: { HEAD_REF?: string },
  config: { previewWorkerName?: string; workersSubdomain?: string },
): string {
  const alias = env.HEAD_REF ? previewAlias(env.HEAD_REF) : null;
  if (!alias || !config.previewWorkerName || !config.workersSubdomain) {
    throw new Error(
      "Could not work out the preview address: the branch name, previewWorkerName or workersSubdomain is missing or unusable.",
    );
  }
  return `https://${alias}-${config.previewWorkerName}.${config.workersSubdomain}.workers.dev`;
}

async function fetchOnce(url: string): Promise<FetchResult> {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30_000) });
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const body = res.status === 200 ? await res.text() : "";
  if (res.status !== 200) await res.body?.cancel();
  return { status: res.status, headers, body, location: res.headers.get("location") };
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function summaryMarkdown(result: CrawlResult): string {
  if (result.failures.length === 0) {
    return `Preview site check passed: ${result.pagesChecked} pages, ${result.linksChecked} links.\n`;
  }
  const rows = result.failures.map(
    (f) =>
      `| ${f.kind} | ${escapeCell(f.target)} | ${escapeCell(f.reason)} | ${escapeCell(f.linkedFrom.join(", "))} |`,
  );
  return ["| Kind | Address | Problem | Linked from |", "| --- | --- | --- | --- |", ...rows, ""].join("\n");
}

async function run(env: NodeJS.ProcessEnv): Promise<number> {
  const summaryFile = env.GITHUB_STEP_SUMMARY;
  const summary = (text: string) => {
    if (summaryFile) appendFileSync(summaryFile, text);
  };
  const fatal = (message: string) => {
    console.error(`::error title=Site check::${message}`);
    summary(`${message}\n`);
    return 1;
  };

  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo, HEAD_SHA: sha, HEAD_REF: ref } = env;
  if (!token || !repo || !sha || !ref) return fatal("The preview check needs GITHUB_TOKEN, GITHUB_REPOSITORY, HEAD_SHA and HEAD_REF.");

  const config = JSON.parse(readFileSync(new URL("../../setup/config.json", import.meta.url), "utf-8"));

  let origin: string;
  try {
    origin = previewOrigin({ HEAD_REF: ref }, config);
  } catch (error) {
    return fatal((error as Error).message);
  }

  try {
    await waitForPreview({
      sha,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      now: () => Date.now(),
      getCheckRuns: async () => {
        const url = `https://api.github.com/repos/${repo}/commits/${sha}/check-runs?check_name=${encodeURIComponent(CHECK_NAME)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
        });
        if (!res.ok) throw new Error(`GitHub returned ${res.status} when reading the check runs for ${sha}.`);
        const data = (await res.json()) as { check_runs?: CheckRun[] };
        return data.check_runs ?? [];
      },
    });
  } catch (error) {
    return fatal((error as Error).message);
  }

  const result = await crawl({
    base: origin,
    expectOrigin: origin,
    expectNoindex: true,
    checkLinks: true,
    concurrency: 4,
    fetcher: fetchOnce,
  });

  console.log(`Checked ${result.pagesChecked} pages and ${result.linksChecked} links on ${origin}`);
  for (const line of formatFailures(result)) {
    console.log(line);
    console.error(`::error title=Site check::${line}`);
  }
  summary(summaryMarkdown(result));
  return result.failures.length === 0 ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run(process.env).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(`::error title=Site check::${(error as Error).message}`);
      process.exitCode = 1;
    },
  );
}
