// Unit tests for astro.config.mjs's build-environment-dependent `site` value
// (contracts/site-origin.md, R2). Re-imports the config module fresh for each
// environment so each test sees the value astro.config.mjs computes at that
// moment.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolveSiteOrigin } from "../../../src/lib/site-origin.ts";

const ORIGINAL_ENV = { ...process.env };

async function importFreshConfig() {
  vi.resetModules();
  return (await import("../../../astro.config.mjs")).default;
}

describe("astro.config.mjs site resolution", () => {
  beforeEach(() => {
    delete process.env.WORKERS_CI;
    delete process.env.WORKERS_CI_BRANCH;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("defaults to https://doncoleman.ca with no WORKERS_CI", async () => {
    const config = await importFreshConfig();
    expect(config.site).toBe("https://doncoleman.ca");
  });

  it("resolves to the reviewHost when WORKERS_CI=1 and branch is main", async () => {
    process.env.WORKERS_CI = "1";
    process.env.WORKERS_CI_BRANCH = "main";
    const config = await importFreshConfig();
    expect(config.site).toBe("https://new.doncoleman.ca");
  });

  it("resolves via resolveSiteOrigin for a non-main branch", async () => {
    process.env.WORKERS_CI = "1";
    process.env.WORKERS_CI_BRANCH = "002-site-foundation";
    const config = await importFreshConfig();

    const setupConfigPath = fileURLToPath(new URL("../../../setup/config.json", import.meta.url));
    const setupConfig = JSON.parse(readFileSync(setupConfigPath, "utf-8"));
    const expected = resolveSiteOrigin(
      { WORKERS_CI: "1", WORKERS_CI_BRANCH: "002-site-foundation" },
      setupConfig,
    );
    expect(config.site).toBe(expected);
  });

  it("sets trailingSlash to always", async () => {
    const config = await importFreshConfig();
    expect(config.trailingSlash).toBe("always");
  });

  it("registers the @astrojs/sitemap integration", async () => {
    const config = (await importFreshConfig()) as unknown as { integrations: Array<{ name?: string }> };
    const names = (config.integrations ?? []).map((integration) => integration?.name);
    expect(names).toContain("@astrojs/sitemap");
  });

  it("registers the Tailwind Vite plugin", async () => {
    const config = (await importFreshConfig()) as unknown as {
      vite?: { plugins?: unknown[] };
    };
    const plugins: Array<{ name?: string }> = [];
    const collect = (value: unknown): void => {
      if (Array.isArray(value)) {
        for (const item of value) collect(item);
      } else if (value && typeof value === "object") {
        plugins.push(value as { name?: string });
      }
    };
    collect(config.vite?.plugins ?? []);
    const hasTailwindPlugin = plugins.some((plugin) => plugin?.name?.startsWith("@tailwindcss/vite"));
    expect(hasTailwindPlugin).toBe(true);
  });
});
