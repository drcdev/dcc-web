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

  it("resolves to https://doncoleman.ca when WORKERS_CI=1 and branch is main", async () => {
    process.env.WORKERS_CI = "1";
    process.env.WORKERS_CI_BRANCH = "main";
    const config = await importFreshConfig();
    expect(config.site).toBe("https://doncoleman.ca");
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

  it("declares typed env.schema entries for the two Workers Builds variables (research R3)", async () => {
    const config = (await importFreshConfig()) as unknown as {
      env?: { schema?: Record<string, { type?: string; context?: string; access?: string; optional?: boolean }> };
    };
    for (const name of ["WORKERS_CI", "WORKERS_CI_BRANCH"]) {
      expect(config.env?.schema?.[name], name).toMatchObject({
        type: "string",
        context: "server",
        access: "public",
        optional: true,
      });
    }
  });

  it("registers the reading-time plugin through markdown.processor (research R6)", async () => {
    const config = (await importFreshConfig()) as unknown as {
      markdown?: { processor?: { name?: string; options?: { mdastPlugins?: Array<{ name?: string }> } } };
    };
    expect(config.markdown?.processor?.name).toBe("satteri");
    const names = (config.markdown?.processor?.options?.mdastPlugins ?? []).map((plugin) => plugin?.name);
    expect(names).toContain("reading-time");
  });
});

describe("astro.config.mjs PUBLIC_TURNSTILE_SITE_KEY (research R6)", () => {
  beforeEach(() => {
    delete process.env.WORKERS_CI;
    delete process.env.WORKERS_CI_BRANCH;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  type Field = { context: string; access: string; type: string; default?: string; optional?: boolean };
  const field = async () =>
    ((await importFreshConfig()).env?.schema as unknown as Record<string, Field> | undefined)?.PUBLIC_TURNSTILE_SITE_KEY;

  it("is a public client string", async () => {
    expect(await field()).toMatchObject({ context: "client", access: "public", type: "string" });
  });

  it("defaults to Cloudflare's always-pass test key outside Workers Builds", async () => {
    expect((await field())?.default).toBe("1x00000000000000000000AA");
  });

  it("has no default under Workers Builds, so a missing variable fails the build", async () => {
    process.env.WORKERS_CI = "1";
    process.env.WORKERS_CI_BRANCH = "main";
    const key = await field();
    expect(key?.default).toBeUndefined();
    expect(key?.optional).not.toBe(true);
  });
});
