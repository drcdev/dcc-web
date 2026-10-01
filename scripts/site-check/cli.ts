#!/usr/bin/env node
// `pnpm run site:check -- --base <url> [flags]` (011-launch contracts/site-check.md).
// Exit codes: 0 no failures, 1 failures, 2 bad arguments or the base could not be reached.
// Never prints an environment value.
import { crawl, formatFailures, type CrawlOptions, type CrawlResult, type FetchResult } from "./crawl.ts";

export interface ParsedArgs {
  base: string;
  expectOrigin?: string;
  expectNoindex: boolean;
  checkLinks: boolean;
  json: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs | { error: string } {
  const args: Partial<ParsedArgs> = { expectNoindex: false, checkLinks: true, json: false };
  const isUrl = (v: string) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]!;
    if (flag === "--base" || flag === "--expect-origin") {
      const value = argv[++i];
      if (value === undefined || !isUrl(value)) return { error: `${flag} needs an http or https address` };
      if (flag === "--base") args.base = value;
      else args.expectOrigin = value;
    } else if (flag === "--expect-noindex") args.expectNoindex = true;
    else if (flag === "--no-links") args.checkLinks = false;
    else if (flag === "--json") args.json = true;
    else return { error: `Unknown flag ${flag}` };
  }
  if (!args.base) return { error: "--base <url> is required" };
  return args as ParsedArgs;
}

export interface CliDeps {
  crawl: (options: CrawlOptions) => Promise<CrawlResult>;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Accepted for symmetry with other scripts; its values are never read or printed. */
  env: Record<string, string | undefined>;
}

async function fetchOnce(url: string): Promise<FetchResult> {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30_000) });
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const contentType = headers["content-type"] ?? "";
  const body = res.status === 200 && /html|xml|text/.test(contentType) ? await res.text() : "";
  if (res.status !== 200) await res.body?.cancel();
  return { status: res.status, headers, body, location: res.headers.get("location") };
}

const defaultDeps: CliDeps = {
  crawl,
  stdout: (t) => process.stdout.write(t),
  stderr: (t) => process.stderr.write(t),
  env: {},
};

export async function main(argv: string[], deps: Partial<CliDeps> = {}): Promise<number> {
  const d = { ...defaultDeps, ...deps };
  const parsed = parseArgs(argv);
  if ("error" in parsed) {
    d.stderr(`${parsed.error}\n`);
    return 2;
  }

  let result: CrawlResult;
  try {
    result = await d.crawl({
      base: parsed.base,
      expectOrigin: parsed.expectOrigin,
      expectNoindex: parsed.expectNoindex,
      checkLinks: parsed.checkLinks,
      concurrency: 4,
      fetcher: fetchOnce,
    });
  } catch {
    d.stderr(`Could not check ${parsed.base}\n`);
    return 2;
  }

  const unreachable =
    result.pagesChecked === 0 && result.failures.some((f) => f.kind === "sitemap" && f.status === null);
  if (unreachable) {
    d.stderr(`Could not reach ${parsed.base}\n`);
    return 2;
  }

  if (parsed.json) {
    d.stdout(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    d.stdout(`Checked ${result.pagesChecked} pages and ${result.linksChecked} links on ${parsed.base}\n`);
    for (const line of formatFailures(result)) d.stdout(`${line}\n`);
  }
  return result.failures.length === 0 ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
