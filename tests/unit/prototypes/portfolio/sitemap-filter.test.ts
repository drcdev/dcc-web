// Prototype pages under /design/ never appear in the sitemap (FR-007, FR-053).
// The filter is an inline closure in astro.config.mjs, so this runs the
// @astrojs/sitemap build hook against a fixed page list, as
// tests/unit/site/sitemap.test.ts does.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type Hook = (options: Record<string, unknown>) => Promise<void> | void;
interface Integration {
  name: string;
  hooks: Record<string, Hook>;
}

const ORIGINAL_ENV = { ...process.env };
const logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };

async function buildSitemap(pathnames: string[]) {
  vi.resetModules();
  delete process.env.WORKERS_CI;
  delete process.env.WORKERS_CI_BRANCH;
  const config = (await import("../../../../astro.config.mjs")).default as unknown as {
    site: string;
    trailingSlash: string;
    integrations: Integration[];
  };
  const sitemap = config.integrations.find((i) => i.name === "@astrojs/sitemap");
  expect(sitemap, "the sitemap integration is registered").toBeDefined();

  const dir = mkdtempSync(join(tmpdir(), "dcc-web-portfolio-sitemap-"));
  await sitemap!.hooks["astro:routes:resolved"]!({ routes: [] });
  await sitemap!.hooks["astro:config:done"]!({
    config: { site: config.site, base: "/", trailingSlash: config.trailingSlash, build: { format: "directory" } },
  });
  await sitemap!.hooks["astro:build:done"]!({
    dir: pathToFileURL(`${dir}/`),
    pages: pathnames.map((pathname) => ({ pathname })),
    logger,
  });
  const xml = readFileSync(join(dir, "sitemap-0.xml"), "utf-8");
  rmSync(dir, { recursive: true, force: true });
  const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  return { site: config.site, entries };
}

describe("sitemap and the /design/ prototypes", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("excludes every page under /design/, still excludes /404, and keeps normal pages", async () => {
    const { site, entries } = await buildSitemap([
      "",
      "about/",
      "design/portfolio/",
      "design/portfolio/a/focus-pocus/",
      "design/portfolio/c/",
      "404.html",
    ]);
    expect(entries).toEqual([`${site}/`, `${site}/about/`]);
    for (const entry of entries) {
      const pathname = new URL(entry).pathname;
      expect(pathname.startsWith("/design/")).toBe(false);
      expect(pathname.startsWith("/404")).toBe(false);
    }
  });
});
