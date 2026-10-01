// Dependency-free sitemap and internal-link crawler (011-launch contracts/site-check.md,
// data-model.md "Crawl"). Pure: every request goes through the injected fetcher, which must never
// follow redirects itself.

export interface FetchResult {
  status: number;
  headers: Record<string, string>;
  body: string;
  location: string | null;
}

export interface CrawlOptions {
  /** Origin to request, e.g. http://127.0.0.1:4321. */
  base: string;
  /** The declared sitemap origin must equal this. */
  expectOrigin?: string;
  /** Every page response must carry X-Robots-Tag: noindex. */
  expectNoindex?: boolean;
  checkLinks: boolean;
  /** Default 4. */
  concurrency?: number;
  fetcher: (url: string) => Promise<FetchResult>;
  /** Pause before a retry; injected so tests need no real time. */
  sleep?: (ms: number) => Promise<void>;
}

export interface CrawlFailure {
  kind: "sitemap" | "page" | "link" | "origin" | "noindex";
  /** Path relative to the site, e.g. /writing/missing/. */
  target: string;
  /** Null for a network failure. */
  status: number | null;
  reason: string;
  linkedFrom: string[];
}

export interface CrawlResult {
  declaredOrigin: string | null;
  pagesChecked: number;
  linksChecked: number;
  failures: CrawlFailure[];
}

const MAX_REDIRECT_HOPS = 5;
const DEFAULT_CONCURRENCY = 4;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** The `<loc>` values of a sitemap or sitemap index, in order. */
export function parseSitemap(xml: string): string[] {
  const locs: string[] = [];
  for (const match of xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)) {
    locs.push(decodeEntities(match[1]!));
  }
  return locs;
}

/** The raw href values of every `<a>` element. */
export function extractLinks(html: string): string[] {
  const links: string[] = [];
  for (const tag of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = tag[0].match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!href) continue;
    links.push(decodeEntities(href[1] ?? href[2] ?? href[3] ?? ""));
  }
  return links;
}

function pathOf(url: URL): string {
  return `${url.pathname}${url.search}`;
}

async function pool<T>(items: T[], limit: number, work: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const item = items[next++]!;
      await work(item);
    }
  });
  await Promise.all(workers);
}

function header(result: FetchResult, name: string): string | undefined {
  for (const [key, value] of Object.entries(result.headers)) {
    if (key.toLowerCase() === name) return value;
  }
  return undefined;
}

export async function crawl(options: CrawlOptions): Promise<CrawlResult> {
  const base = new URL(options.base).origin;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const failures: CrawlFailure[] = [];
  const result: CrawlResult = { declaredOrigin: null, pagesChecked: 0, linksChecked: 0, failures };

  type Outcome = { ok: true; res: FetchResult } | { ok: false };

  async function get(path: string): Promise<Outcome> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await options.fetcher(`${base}${path}`);
        if (res.status >= 500 && attempt === 0) {
          await sleep(1000);
          continue;
        }
        return { ok: true, res };
      } catch {
        if (attempt === 0) await sleep(1000);
      }
    }
    return { ok: false };
  }

  const fail = (f: Omit<CrawlFailure, "linkedFrom"> & { linkedFrom?: string[] }) =>
    failures.push({ linkedFrom: [], ...f });

  // 1. robots.txt, then the sitemap index.
  let indexPath = "/sitemap-index.xml";
  const robots = await get("/robots.txt");
  if (robots.ok && robots.res.status === 200) {
    const line = robots.res.body.match(/^\s*Sitemap:\s*(\S+)/im);
    if (line) {
      try {
        indexPath = pathOf(new URL(line[1]!, base));
      } catch {
        // keep the fallback
      }
    }
  }

  const sitemapBodies: { path: string; body: string }[] = [];
  const index = await get(indexPath);
  if (!index.ok) {
    fail({ kind: "sitemap", target: indexPath, status: null, reason: "could not be reached" });
    return result;
  }
  if (index.res.status !== 200) {
    fail({ kind: "sitemap", target: indexPath, status: index.res.status, reason: `returned ${index.res.status}` });
    return result;
  }

  const pageLocs: string[] = [];
  if (/<sitemapindex\b/i.test(index.res.body)) {
    const children = parseSitemap(index.res.body);
    await pool(children, concurrency, async (loc) => {
      let path: string;
      try {
        path = pathOf(new URL(loc));
      } catch {
        fail({ kind: "sitemap", target: loc, status: null, reason: "is not a valid address" });
        return;
      }
      const child = await get(path);
      if (!child.ok) {
        fail({ kind: "sitemap", target: path, status: null, reason: "could not be reached" });
      } else if (child.res.status !== 200) {
        fail({ kind: "sitemap", target: path, status: child.res.status, reason: `returned ${child.res.status}` });
      } else {
        sitemapBodies.push({ path, body: child.res.body });
      }
    });
    // Keep the order of the index so results are stable.
    sitemapBodies.sort((a, b) => children.findIndex((c) => c.endsWith(a.path)) - children.findIndex((c) => c.endsWith(b.path)));
  } else {
    sitemapBodies.push({ path: indexPath, body: index.res.body });
  }
  for (const s of sitemapBodies) pageLocs.push(...parseSitemap(s.body));

  // 3. Origins.
  const pages: string[] = [];
  const origins = new Set<string>();
  for (const loc of pageLocs) {
    try {
      const url = new URL(loc);
      origins.add(url.origin);
      pages.push(pathOf(url));
    } catch {
      fail({ kind: "sitemap", target: loc, status: null, reason: "is not a valid address" });
    }
  }
  const declared = [...origins][0] ?? null;
  result.declaredOrigin = declared;
  if (origins.size > 1) {
    fail({
      kind: "origin",
      target: indexPath,
      status: null,
      reason: `sitemap names more than one origin (${[...origins].join(", ")})`,
    });
  }
  if (options.expectOrigin && declared && declared !== new URL(options.expectOrigin).origin) {
    fail({
      kind: "origin",
      target: indexPath,
      status: null,
      reason: `sitemap names ${declared}, expected ${new URL(options.expectOrigin).origin}`,
    });
  }

  // 4. Pages.
  const okPages = new Map<string, string>();
  await pool([...new Set(pages)], concurrency, async (path) => {
    const page = await get(path);
    if (!page.ok) {
      fail({ kind: "page", target: path, status: null, reason: "could not be reached" });
      return;
    }
    const { res } = page;
    if (res.status >= 300 && res.status < 400) {
      fail({ kind: "page", target: path, status: res.status, reason: `redirected to ${res.location ?? "an unknown address"}` });
      return;
    }
    if (res.status !== 200) {
      fail({ kind: "page", target: path, status: res.status, reason: `returned ${res.status}` });
      return;
    }
    if (options.expectNoindex && !/noindex/i.test(header(res, "x-robots-tag") ?? "")) {
      fail({ kind: "noindex", target: path, status: 200, reason: "response has no X-Robots-Tag: noindex" });
    }
    okPages.set(path, res.body);
  });
  result.pagesChecked = new Set(pages).size;

  // 5. Links.
  if (options.checkLinks) {
    const sameSite = new Set([base, ...(declared ? [declared] : [])]);
    const linkedFrom = new Map<string, Set<string>>();
    for (const [pagePath, body] of okPages) {
      const pageUrl = new URL(pagePath, base);
      for (const raw of extractLinks(body)) {
        const href = raw.trim();
        if (href === "" || href.startsWith("#")) continue;
        let url: URL;
        try {
          url = new URL(href, pageUrl);
        } catch {
          continue;
        }
        if (url.protocol !== "http:" && url.protocol !== "https:") continue;
        if (!sameSite.has(url.origin)) continue;
        const target = pathOf(url);
        if (!linkedFrom.has(target)) linkedFrom.set(target, new Set());
        linkedFrom.get(target)!.add(pagePath);
      }
    }

    const targets = [...linkedFrom.keys()].sort();
    result.linksChecked = targets.length;
    await pool(targets, concurrency, async (target) => {
      let path = target;
      let problem: { status: number | null; reason: string } | null = null;
      for (let hop = 0; ; hop++) {
        const res = await get(path);
        if (!res.ok) {
          problem = { status: null, reason: "could not be reached" };
          break;
        }
        const { status, location } = res.res;
        if (status >= 300 && status < 400 && location) {
          if (hop >= MAX_REDIRECT_HOPS) {
            problem = { status, reason: `redirected more than ${MAX_REDIRECT_HOPS} times` };
            break;
          }
          const next = new URL(location, new URL(path, base));
          if (!sameSite.has(next.origin)) break; // leaves the site: not ours to check
          path = pathOf(next);
          continue;
        }
        if (status !== 200) problem = { status, reason: `returned ${status}` };
        break;
      }
      if (problem) {
        fail({ kind: "link", target, ...problem, linkedFrom: [...linkedFrom.get(target)!].sort() });
      }
    });
  }

  failures.sort((a, b) => a.kind.localeCompare(b.kind) || a.target.localeCompare(b.target));
  return result;
}

/** One plain line per failure. */
export function formatFailures(result: CrawlResult): string[] {
  return result.failures.map((f) => {
    const line = `${f.kind}  ${f.target}  ${f.reason}`;
    return f.linkedFrom.length > 0 ? `${line}  (linked from ${f.linkedFrom.join(", ")})` : line;
  });
}
