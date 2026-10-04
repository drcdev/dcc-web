// Unit tests for astro.config.mjs's build-environment-dependent `site` value
// (contracts/site-origin.md, R2). Re-imports the config module fresh for each
// environment so each test sees the value astro.config.mjs computes at that
// moment.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fontProviders } from "astro/config";
import { resolveSiteOrigin } from "../../../src/lib/site-origin.ts";
import { INTER_UNICODE_RANGE, MONO_FALLBACK_STACK, SYSTEM_FONT_STACK } from "../../../src/lib/fonts/charset.ts";

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

  it("sets trailingSlash to ignore", async () => {
    const config = await importFreshConfig();
    expect(config.trailingSlash).toBe("ignore");
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

  it("gives WORKERS_CI_BRANCH no default, so a Workers Builds build with no branch hands over undefined (FR-046)", async () => {
    const config = (await importFreshConfig()) as unknown as {
      env?: { schema?: Record<string, { default?: unknown }> };
    };
    expect(config.env?.schema?.WORKERS_CI_BRANCH).toBeDefined();
    expect(config.env?.schema?.WORKERS_CI_BRANCH).not.toHaveProperty("default");
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

// Self-hosted Inter through Astro's Fonts API (FR-001, FR-002, FR-005, FR-006).
describe("fonts", () => {
  type Variant = { weight: number | string; style: string; src: string[]; display?: string; unicodeRange?: string[] };
  type Family = {
    name: string;
    cssVariable: string;
    provider: { name: string };
    fallbacks: string[];
    optimizedFallbacks: boolean;
    options: { variants: Variant[] };
  };

  async function inter(): Promise<Family> {
    const config = (await importFreshConfig()) as unknown as { fonts?: Family[] };
    // Two families since feature 019 (FR-001, FR-005); this supersedes the length-1 check of 018.
    expect(config.fonts).toHaveLength(2);
    return config.fonts![0]!;
  }

  async function mono(): Promise<Family> {
    const config = (await importFreshConfig()) as unknown as { fonts?: Family[] };
    expect(config.fonts).toHaveLength(2);
    return config.fonts![1]!;
  }

  it("declares one Inter family from the local provider on --font-inter", async () => {
    const family = await inter();
    expect(family.name).toBe("Inter");
    expect(family.cssVariable).toBe("--font-inter");
    expect(family.provider.name).toBe(fontProviders.local().name);
  });

  it("has four variants from src/assets/fonts, with swap and the shared unicode-range", async () => {
    const { variants } = (await inter()).options;
    expect(variants.map((v) => [String(v.weight), v.style, v.src])).toEqual([
      ["400", "normal", ["./src/assets/fonts/Inter-Regular.woff2"]],
      ["400", "italic", ["./src/assets/fonts/Inter-Italic.woff2"]],
      ["700", "normal", ["./src/assets/fonts/Inter-Bold.woff2"]],
      ["700", "italic", ["./src/assets/fonts/Inter-BoldItalic.woff2"]],
    ]);
    for (const variant of variants) {
      expect(variant.display).toBe("swap");
      expect(variant.unicodeRange).toEqual([...INTER_UNICODE_RANGE]);
    }
  });

  it("falls back to today's system stack, generic last, with optimized fallbacks on", async () => {
    const family = await inter();
    expect(family.fallbacks).toEqual([...SYSTEM_FONT_STACK]);
    expect(family.fallbacks.at(-1)).toBe("sans-serif");
    expect(family.optimizedFallbacks).toBe(true);
  });

  it("declares JetBrains Mono from the local provider on --font-jetbrains-mono (M01, M02)", async () => {
    const family = await mono();
    expect(family.name).toBe("JetBrains Mono");
    expect(family.cssVariable).toBe("--font-jetbrains-mono");
    expect(family.provider.name).toBe(fontProviders.local().name);
  });

  it("has four mono variants from src/assets/fonts/jetbrains-mono, with swap and the shared unicode-range", async () => {
    const { variants } = (await mono()).options;
    const dir = "./src/assets/fonts/jetbrains-mono/";
    expect(variants.map((v) => [String(v.weight), v.style, v.src])).toEqual([
      ["400", "normal", [`${dir}JetBrainsMono-Regular.woff2`]],
      ["400", "italic", [`${dir}JetBrainsMono-Italic.woff2`]],
      ["700", "normal", [`${dir}JetBrainsMono-Bold.woff2`]],
      ["700", "italic", [`${dir}JetBrainsMono-BoldItalic.woff2`]],
    ]);
    for (const variant of variants) {
      expect(variant.display).toBe("swap");
      expect(variant.unicodeRange).toEqual([...INTER_UNICODE_RANGE]);
    }
  });

  it("falls back to the mono stack, generic last, with optimized fallbacks on (M03)", async () => {
    const family = await mono();
    expect(family.fallbacks).toEqual([...MONO_FALLBACK_STACK]);
    expect(family.fallbacks.at(-1)).toBe("monospace");
    expect(family.optimizedFallbacks).toBe(true);
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
