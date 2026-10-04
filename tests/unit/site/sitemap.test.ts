// The sitemap integration as configured in astro.config.mjs (research R9;
// contracts/head-metadata.md; FR-018): run its build hook against a fixed page
// list and check the entries it writes. `@astrojs/sitemap` already drops the
// exact `/404` status page; the configured `filter` must also drop anything
// else under `/404` (for example `404.html` or a nested path), and every entry
// must use the configured `site`.
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

async function buildSitemap(env: Record<string, string>, pathnames: string[]) {
  vi.resetModules();
  delete process.env.WORKERS_CI;
  delete process.env.WORKERS_CI_BRANCH;
  Object.assign(process.env, env);
  const config = (await import("../../../astro.config.mjs")).default as unknown as {
    site: string;
    trailingSlash: string;
    integrations: Integration[];
  };
  const sitemap = config.integrations.find((i) => i.name === "@astrojs/sitemap");
  expect(sitemap, "the sitemap integration is registered").toBeDefined();

  const dir = mkdtempSync(join(tmpdir(), "dcc-web-sitemap-"));
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
  const index = readFileSync(join(dir, "sitemap-index.xml"), "utf-8");
  rmSync(dir, { recursive: true, force: true });
  const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return { site: config.site, entries, index };
}

describe("astro.config.mjs sitemap", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("excludes every page whose pathname starts with /404", async () => {
    const { site, entries } = await buildSitemap({}, ["", "about/", "404/", "404.html", "404/nested/"]);
    expect(entries).toEqual([`${site}/`, `${site}/about/`]);
    for (const entry of entries) expect(new URL(entry!).pathname.startsWith("/404")).toBe(false);
  });

  it("excludes the per-post question source files (specs/022 T023)", async () => {
    const { site, entries } = await buildSitemap({}, ["", "writing/a-post/", "writing/a-post/question-source.json"]);
    expect(entries).toEqual([`${site}/`, `${site}/writing/a-post/`]);
  });

  it.each([
    ["local build", {}, "https://doncoleman.ca"],
    ["main branch build", { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" }, "https://doncoleman.ca"],
  ])("uses the configured site for every entry (%s)", async (_label, env, origin) => {
    const { site, entries, index } = await buildSitemap(env, ["", "404/"]);
    expect(site).toBe(origin);
    expect(entries).toEqual([`${origin}/`]);
    expect(index).toContain(`<loc>${origin}/sitemap-0.xml</loc>`);
  });
});
