import { describe, expect, it } from "vitest";
import { main, parseArgs } from "../../../scripts/site-check/cli.ts";
import type { CrawlOptions, CrawlResult } from "../../../scripts/site-check/crawl.ts";

function run(argv: string[], result: CrawlResult | Error, env: Record<string, string | undefined> = {}) {
  let out = "";
  let err = "";
  let seen: CrawlOptions | undefined;
  return main(argv, {
    crawl: async (o) => {
      seen = o;
      if (result instanceof Error) throw result;
      return result;
    },
    stdout: (s) => (out += s),
    stderr: (s) => (err += s),
    env,
  }).then((code) => ({ code, out, err, seen }));
}

const pass: CrawlResult = { declaredOrigin: "https://x", pagesChecked: 3, linksChecked: 7, failures: [] };
const fail: CrawlResult = {
  declaredOrigin: "https://x",
  pagesChecked: 3,
  linksChecked: 7,
  failures: [{ kind: "link", target: "/m/", status: 404, reason: "returned 404", linkedFrom: ["/a/"] }],
};

describe("parseArgs", () => {
  it("reads every flag", () => {
    expect(
      parseArgs(["--base", "http://h", "--expect-origin", "https://o", "--expect-noindex", "--no-links", "--json"]),
    ).toEqual({ base: "http://h", expectOrigin: "https://o", expectNoindex: true, checkLinks: false, json: true });
  });
  it("requires --base and rejects unknown flags", () => {
    expect(parseArgs([])).toEqual({ error: expect.stringContaining("--base") });
    expect(parseArgs(["--base", "http://h", "--wat"])).toEqual({ error: expect.stringContaining("--wat") });
    expect(parseArgs(["--base", "not a url"])).toEqual({ error: expect.stringContaining("--base") });
  });
});

describe("main", () => {
  it("exits 0 with the heading line when nothing fails", async () => {
    const r = await run(["--base", "http://h"], pass);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Checked 3 pages and 7 links on http://h");
    expect(r.seen).toMatchObject({ base: "http://h", checkLinks: true, concurrency: 4 });
  });
  it("exits 1 and prints one line per failure", async () => {
    const r = await run(["--base", "http://h"], fail);
    expect(r.code).toBe(1);
    expect(r.out).toContain("link  /m/  returned 404  (linked from /a/)");
  });
  it("passes the flags through to the crawl", async () => {
    const r = await run(["--base", "http://h", "--expect-origin", "https://o", "--expect-noindex", "--no-links"], pass);
    expect(r.seen).toMatchObject({ expectOrigin: "https://o", expectNoindex: true, checkLinks: false });
  });
  it("prints JSON with --json", async () => {
    const r = await run(["--base", "http://h", "--json"], fail);
    expect(JSON.parse(r.out)).toEqual(fail);
    expect(r.code).toBe(1);
  });
  it("exits 2 on bad arguments", async () => {
    const r = await run([], pass);
    expect(r.code).toBe(2);
    expect(r.err).toContain("--base");
  });
  it("exits 2 when the base cannot be reached", async () => {
    const unreachable: CrawlResult = {
      declaredOrigin: null,
      pagesChecked: 0,
      linksChecked: 0,
      failures: [
        { kind: "sitemap", target: "/sitemap-index.xml", status: null, reason: "could not be reached", linkedFrom: [] },
      ],
    };
    expect((await run(["--base", "http://h"], unreachable)).code).toBe(2);
    expect((await run(["--base", "http://h"], new Error("x"))).code).toBe(2);
  });
  it("never prints an environment value", async () => {
    const r = await run(["--base", "http://h"], fail, {
      GITHUB_TOKEN: "s3cret-token-value",
      CLOUDFLARE_API_TOKEN: "cf-secret",
    });
    expect(r.out + r.err).not.toContain("s3cret-token-value");
    expect(r.out + r.err).not.toContain("cf-secret");
  });
});
