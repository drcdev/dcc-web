// T012: the launch's expected pages and sitemap paths (setup/config.json `launch`, data-model.md
// "SetupConfig") match the repository's content and the production build's sitemap.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configSchema } from "../../scripts/setup-check/schemas.ts";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const config = configSchema.parse(JSON.parse(readFileSync(`${repoRoot}setup/config.json`, "utf-8")));

describe("launch.expectedPages and launch.expectedPaths", () => {
  let site: FixtureSiteResult;
  beforeAll(async () => {
    // A default build has no WORKERS_CI variables, so it is the production build: origin https://doncoleman.ca.
    site = await buildFixtureSite([]);
  });
  afterAll(() => site?.cleanup());

  it("are declared in setup/config.json, and the review host is kept", () => {
    expect(config.reviewHost).toBe("new.doncoleman.ca");
    expect(config.launch?.expectedPages.length).toBeGreaterThan(0);
    expect(config.launch?.expectedPaths.length).toBeGreaterThan(0);
  });

  it("names a file in src/content/pages/ for every expected page id", () => {
    for (const id of config.launch!.expectedPages) {
      expect(existsSync(`${repoRoot}src/content/pages/${id}.mdx`), `src/content/pages/${id}.mdx is missing`).toBe(true);
    }
  });

  it("lists every expected path in the production sitemap", () => {
    expect(site.message).toBe("");
    expect(site.ok).toBe(true);
    const index = site.read("sitemap-index.xml");
    expect(index).toContain("https://doncoleman.ca/");
    const sitemap = site.read("sitemap-0.xml");
    const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    for (const path of config.launch!.expectedPaths) {
      expect(locs.has(`https://doncoleman.ca${path}`), `the sitemap has no entry for ${path}`).toBe(true);
    }
  });
});
