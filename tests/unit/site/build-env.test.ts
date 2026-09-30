// Builds the site twice, once with the main-branch Workers Builds environment
// and once with a preview-branch environment, and checks the output: every HTML
// page is noindex, the home page's canonical and og:url use the origin
// resolveSiteOrigin returns for that environment, every site address in the
// build uses that one origin, and _headers still sends X-Robots-Tag: noindex
// (FR-017a, FR-019; contracts/site-origin.md, contracts/head-metadata.md).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { topics } from "../../../src/config/topics.ts";
import { resolveSiteOrigin } from "../../../src/lib/site-origin.ts";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const setupConfig = JSON.parse(readFileSync(join(root, "setup/config.json"), "utf-8"));
const themeInitSource = readFileSync(join(root, "src/scripts/theme-init.js"), "utf-8").trim();

const BUILD_TIMEOUT = 300_000;

/** Hosts a build could use for its own address; any URL on these hosts must use the build's origin. */
function isSiteHost(host: string): boolean {
  return (
    host === "doncoleman.ca" ||
    host.endsWith(".doncoleman.ca") ||
    host === setupConfig.reviewHost ||
    host.endsWith(".workers.dev")
  );
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const environments = [
  { label: "main branch", env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main", PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" } },
  { label: "preview branch", env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "002-site-foundation", PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" } },
] as const;

describe.each(environments)("astro build with the $label environment", ({ env }) => {
  const expectedOrigin = resolveSiteOrigin(env, setupConfig);
  let outDir = "";
  let files: string[] = [];

  beforeAll(async () => {
    outDir = mkdtempSync(join(tmpdir(), "dcc-web-build-env-"));
    const childEnv: NodeJS.ProcessEnv = { ...process.env, ...env, ASTRO_TELEMETRY_DISABLED: "1" };
    // Vitest sets these; they would change how Astro/Vite build.
    delete childEnv.VITEST;
    delete childEnv.VITEST_MODE;
    delete childEnv.VITEST_POOL_ID;
    delete childEnv.VITEST_WORKER_ID;
    delete childEnv.NODE_ENV;
    await run(process.execPath, [join(root, "node_modules/astro/bin/astro.mjs"), "build", "--outDir", outDir], {
      cwd: root,
      env: childEnv,
      maxBuffer: 64 * 1024 * 1024,
    });
    files = walk(outDir);
  }, BUILD_TIMEOUT);

  afterAll(() => {
    if (outDir) rmSync(outDir, { recursive: true, force: true });
  });

  it("resolves to an https origin distinct per environment", () => {
    expect(expectedOrigin).toMatch(/^https:\/\/[^/]+$/);
    if (env.WORKERS_CI_BRANCH === "main") {
      expect(expectedOrigin).toBe(`https://${setupConfig.reviewHost}`);
    } else {
      expect(expectedOrigin).toMatch(/\.workers\.dev$/);
    }
  });

  it("gives every HTML file a noindex robots meta tag", () => {
    const htmlFiles = files.filter((f) => f.endsWith(".html"));
    expect(htmlFiles.length).toBeGreaterThan(0);
    for (const file of htmlFiles) {
      const html = readFileSync(file, "utf-8");
      expect(html, file).toMatch(/<meta\s+name="robots"\s+content="noindex"\s*\/?>/);
    }
  });

  it("uses the resolved origin for the home page's canonical and og:url", () => {
    const html = readFileSync(join(outDir, "index.html"), "utf-8");
    const canonical = /<link\s+rel="canonical"\s+href="([^"]+)"/.exec(html)?.[1];
    const ogUrl = /<meta\s+property="og:url"\s+content="([^"]+)"/.exec(html)?.[1];
    expect(canonical).toBe(`${expectedOrigin}/`);
    expect(ogUrl).toBe(`${expectedOrigin}/`);
  });

  it("uses that one origin for every site address in the build", () => {
    const textFiles = files.filter((f) => /\.(html|xml|txt)$/.test(f));
    let checked = 0;
    for (const file of textFiles) {
      const text = readFileSync(file, "utf-8");
      for (const match of text.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
        const url = new URL(match[0]);
        if (!isSiteHost(url.host)) continue;
        checked += 1;
        expect(url.origin, `${file}: ${match[0]}`).toBe(expectedOrigin);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("points robots.txt's Sitemap line at the resolved origin (FR-018)", () => {
    const robots = readFileSync(join(outDir, "robots.txt"), "utf-8");
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).not.toMatch(/^Disallow:/im);
    expect(robots.match(/^Sitemap: (.+)$/m)?.[1]).toBe(`${expectedOrigin}/sitemap-index.xml`);
  });

  it("uses the resolved origin for every sitemap entry and excludes the not-found page (FR-017a, FR-018)", () => {
    const index = readFileSync(join(outDir, "sitemap-index.xml"), "utf-8");
    const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(sitemaps).toEqual([`${expectedOrigin}/sitemap-0.xml`]);
    const entries = [...readFileSync(join(outDir, "sitemap-0.xml"), "utf-8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1]!,
    );
    // A preview build includes the sample post, which is a draft; production leaves it out (spec 008 R3).
    // The listing pages are published on every build: all posts and one page per topic (spec 008 US4).
    const pages = [
      "/",
      "/about/",
      "/contact/",
      "/privacy-policy/",
      "/projects/",
      "/projects/focus-pocus/",
      "/services/",
      "/speaking/",
      "/technology/",
      "/terms-of-use/",
      "/writing/",
      "/writing/all/",
      ...topics.map((topic) => `/writing/topics/${topic.id}/`),
    ];
    // Don's real posts (feature 010) are published, so every build lists them.
    const realPosts = [
      "/writing/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/",
      "/writing/self-contained-development-for-ghost-themes/",
      "/writing/starting-something-new/",
      "/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/",
    ];
    const samplePosts = ["/writing/sample-everything/"];
    const expected = env.WORKERS_CI_BRANCH === "main" ? [...pages, ...realPosts] : [...pages, ...realPosts, ...samplePosts];
    expect([...entries].sort()).toEqual(expected.map((path) => `${expectedOrigin}${path}`).sort());
  });

  it("leaves the draft sample post out of production and builds it, labelled, elsewhere (FR-032, FR-046)", () => {
    const page = join(outDir, "writing/sample-everything/index.html");
    if (env.WORKERS_CI_BRANCH === "main") {
      expect(files.some((f) => f.includes(`${join("writing", "sample-")}`))).toBe(false);
      // The listing shows the real posts and links to no sample.
      const listing = readFileSync(join(outDir, "writing/index.html"), "utf-8");
      expect(listing).toContain('href="/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/"');
      expect(listing).not.toContain("/writing/sample-");
      expect(listing).not.toContain("data-draft-label");
    } else {
      const html = readFileSync(page, "utf-8");
      expect(html).toMatch(/data-draft-notice[^>]*>\s*<strong>Draft\.<\/strong>/);
      expect(html).toMatch(/<meta\s+name="robots"\s+content="noindex"\s*\/?>/);
      expect(readFileSync(join(outDir, "writing/index.html"), "utf-8")).toContain("data-draft-label");
    }
  });

  it("places the pre-paint theme script before the stylesheet in the built home page", () => {
    const html = readFileSync(join(outDir, "index.html"), "utf-8");
    const head = html.slice(0, html.indexOf("</head>"));
    const scriptAt = head.indexOf(themeInitSource);
    expect(scriptAt).toBeGreaterThan(-1);
    const stylesheetAt = head.search(/<link\s[^>]*rel="stylesheet"|<style[\s>]/);
    expect(stylesheetAt).toBeGreaterThan(-1);
    expect(scriptAt).toBeLessThan(stylesheetAt);
  });

  it("copies _headers with X-Robots-Tag: noindex for every path", () => {
    const headers = readFileSync(join(outDir, "_headers"), "utf-8");
    expect(headers).toMatch(/^\/\*\s*$/m);
    expect(headers).toMatch(/^\s+X-Robots-Tag:\s*noindex\s*$/m);
  });
});
