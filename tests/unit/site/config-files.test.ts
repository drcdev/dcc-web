import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

function stripJsonComments(text: string): string {
  // Strip // line comments and /* */ block comments outside of strings.
  let result = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        result += char;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      result += char;
      if (char === "\\") {
        result += next;
        i++;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    result += char;
  }
  return result;
}

describe("wrangler.jsonc", () => {
  const wranglerPath = fileURLToPath(new URL("../../../wrangler.jsonc", import.meta.url));
  const config = JSON.parse(stripJsonComments(readFileSync(wranglerPath, "utf-8")));

  it("names the worker dcc-web", () => {
    expect(config.name).toBe("dcc-web");
  });

  it("serves static assets from ./dist", () => {
    expect(config.assets?.directory).toBe("./dist");
  });

  it("enables workers_dev and preview_urls", () => {
    expect(config.workers_dev).toBe(true);
    expect(config.preview_urls).toBe(true);
  });

  it("runs the Worker only for /api/* (Principle VIII)", () => {
    expect(config.main).toBe("worker/src/index.ts");
    expect(config.assets?.run_worker_first).toEqual(["/api/*"]);
  });

  it("binds only contact in production and only contact-preview in preview, both as DB", () => {
    expect(config.d1_databases).toHaveLength(1);
    expect(config.d1_databases[0]).toMatchObject({
      binding: "DB",
      database_name: "contact",
      migrations_dir: "migrations",
    });
    const preview = config.env?.preview;
    expect(preview?.d1_databases).toHaveLength(1);
    expect(preview.d1_databases[0]).toMatchObject({
      binding: "DB",
      database_name: "contact-preview",
      migrations_dir: "migrations",
    });
    expect(JSON.stringify(config).match(/"database_name"/g)).toHaveLength(2);
  });

  it("has two different database ids, each a UUID or the committed placeholder", () => {
    // The placeholder allowance is removed in T074, once Don's real IDs are committed.
    const isAllowed = (id: unknown) =>
      typeof id === "string" &&
      (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
        /^00000000-0000-0000-0000-00000000000[12]$/.test(id));
    const production = config.d1_databases[0].database_id;
    const preview = config.env.preview.d1_databases[0].database_id;
    expect(isAllowed(production)).toBe(true);
    expect(isAllowed(preview)).toBe(true);
    expect(production).not.toBe(preview);
  });

  it("names the preview Worker dcc-web-preview", () => {
    expect(config.env?.preview?.name).toBe("dcc-web-preview");
  });

  it("runs the same daily cron in both environments", () => {
    expect(config.triggers?.crons).toEqual(["17 3 * * *"]);
    expect(config.env.preview.triggers?.crons).toEqual(["17 3 * * *"]);
  });

  it("requires the same three secrets in both environments", () => {
    const names = ["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"];
    expect(config.secrets?.required).toEqual(names);
    expect(config.env.preview.secrets?.required).toEqual(names);
  });

  it("keeps invocation logs off", () => {
    expect(config.observability?.enabled).toBe(true);
    expect(config.observability?.logs?.invocation_logs).toBe(false);
  });

  it("holds no secret-looking vars", () => {
    const vars = { ...(config.vars ?? {}), ...(config.env?.preview?.vars ?? {}) };
    for (const name of Object.keys(vars)) {
      expect(name).not.toMatch(/SECRET|TOKEN|SALT|KEY|PASSWORD/i);
    }
  });

  it("serves the custom 404 page for unknown paths", () => {
    expect(config.assets?.not_found_handling).toBe("404-page");
  });
});

describe("astro.config.mjs", () => {
  it("sets no adapter and no server output (static by default, Principle V)", async () => {
    const config = (await import("../../../astro.config.mjs")).default;
    expect(config.adapter).toBeUndefined();
    expect(config.output).not.toBe("server");
  });
});

describe("vitest.config.ts", () => {
  it("includes unit and component tests", async () => {
    const configFn = (await import("../../../vitest.config.ts")).default;
    const resolved = await configFn({ command: "serve", mode: "test" });
    const projects = (resolved.test?.projects ?? []) as { test?: { include?: string[] } }[];
    const include = projects.flatMap((project) => project.test?.include ?? []);
    expect(include).toEqual(
      expect.arrayContaining(["tests/unit/**/*.test.ts", "tests/component/**/*.test.ts"]),
    );
  });
});

interface TestPlaywrightProject {
  name: string;
  testMatch?: unknown;
  testIgnore?: unknown;
  use?: { defaultBrowserType?: string };
}

interface TestPlaywrightConfig {
  retries: number;
  webServer: { command: string; url: string; env?: Record<string, string> }[];
  use?: { baseURL?: string };
  updateSnapshots?: string;
  expect?: { toHaveScreenshot?: Record<string, unknown> };
  projects: TestPlaywrightProject[];
}

describe("playwright.config.ts", () => {
  async function loadConfig(): Promise<TestPlaywrightConfig> {
    const config = (await import("../../../playwright.config.ts")).default;
    return config as unknown as TestPlaywrightConfig;
  }

  function matchesPattern(pattern: unknown, filePath: string): boolean {
    const patterns = Array.isArray(pattern) ? pattern : pattern ? [pattern] : [];
    return patterns.some((p) => (p instanceof RegExp ? p.test(filePath) : false));
  }

  const DEFAULT_TEST_MATCH = /.*\.(test|spec)\.(js|mjs|cjs|ts|mts|cts|jsx|tsx)$/;

  function projectMatches(project: { testMatch?: unknown; testIgnore?: unknown }, filePath: string): boolean {
    const matchesInclude = project.testMatch
      ? matchesPattern(project.testMatch, filePath)
      : DEFAULT_TEST_MATCH.test(filePath);
    if (!matchesInclude) return false;
    if (project.testIgnore && matchesPattern(project.testIgnore, filePath)) return false;
    return true;
  }

  it("has retries: 0", async () => {
    const config = await loadConfig();
    expect(config.retries).toBe(0);
  });

  it("runs the webServer through wrangler dev on 127.0.0.1:4321 with metrics off", async () => {
    const config = await loadConfig();
    const server = config.webServer[0];
    expect(server?.command).toContain("wrangler dev --ip 127.0.0.1 --port 4321");
    expect(server?.command).toContain("--persist-to .cache/e2e-state");
    expect(server?.command).toContain("--env-file tests/fixtures/worker/e2e.env");
    expect(server?.command).toContain("wrangler d1 migrations apply contact --local --persist-to .cache/e2e-state");
    expect(server?.env?.WRANGLER_SEND_METRICS).toBe("false");
    expect(server?.env?.ASTRO_PREVIEW_BACKGROUND).toBeUndefined();
    expect(server?.url).toBe("http://127.0.0.1:4321");
  });

  it("uses baseURL http://127.0.0.1:4321", async () => {
    const config = await loadConfig();
    expect(config.use?.baseURL).toBe("http://127.0.0.1:4321");
  });

  it("has exactly the projects e2e, a11y, budget, visual, sections, each using Chromium", async () => {
    const config = await loadConfig();
    const names = config.projects.map((p) => p.name).sort();
    expect(names).toEqual(["a11y", "budget", "e2e", "sections", "visual"]);
    for (const project of config.projects) {
      expect(project.use?.defaultBrowserType).toBe("chromium");
    }
  });

  it("never auto-updates snapshots (a missing baseline fails, FR-005b)", async () => {
    const config = await loadConfig();
    expect(config.updateSnapshots).toBe("none");
  });

  it("sets toHaveScreenshot defaults (FR-005a)", async () => {
    const config = await loadConfig();
    expect(config.expect?.toHaveScreenshot).toEqual({
      maxDiffPixelRatio: 0.001,
      animations: "disabled",
      caret: "hide",
    });
  });

  it("matches every existing tests/e2e/*.spec.ts file to exactly one project (FR-030a)", async () => {
    const config = await loadConfig();
    const e2eDir = fileURLToPath(new URL("../../../tests/e2e/", import.meta.url));
    const files = readdirSync(e2eDir).filter((f) => f.endsWith(".spec.ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const matching = config.projects.filter((p) => projectMatches(p, file));
      expect(
        matching.map((p) => p.name),
        `${file} should be matched by exactly one project`,
      ).toHaveLength(1);
    }
  });
});

describe("package.json scripts", () => {
  const packageJsonPath = fileURLToPath(new URL("../../../package.json", import.meta.url));
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  it("keeps verify as the exact gate sequence (contracts/verify-gate.md)", () => {
    expect(pkg.scripts.verify).toBe(
      "pnpm run lint:secrets && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build && pnpm run test:e2e",
    );
  });

  it("runs all four Playwright projects from test:e2e", () => {
    expect(pkg.scripts["test:e2e"]).toBe("playwright test");
  });

  it("adds test:a11y, test:budget and test:visual, each running one project", () => {
    expect(pkg.scripts["test:a11y"]).toBe("playwright test --project=a11y");
    expect(pkg.scripts["test:budget"]).toBe("playwright test --project=budget");
    expect(pkg.scripts["test:visual"]).toBe("playwright test --project=visual");
  });

  it("adds test:visual:update running the visual project with --update-snapshots", () => {
    expect(pkg.scripts["test:visual:update"]).toBe("playwright test --project=visual --update-snapshots");
  });

  it("adds reference:capture using tests/reference/playwright.config.ts", () => {
    expect(pkg.scripts["reference:capture"]).toBe(
      "playwright test --config tests/reference/playwright.config.ts",
    );
  });

  it("adds deploy:preview running scripts/deploy/preview.ts", () => {
    expect(pkg.scripts["deploy:preview"]).toBe("node scripts/deploy/preview.ts");
  });

  it("lists the new styling and sitemap dependencies", () => {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of ["tailwindcss", "@tailwindcss/vite", "@tailwindcss/typography", "@astrojs/sitemap"]) {
      expect(allDeps[name], `${name} should be listed in package.json`).toBeDefined();
    }
  });
});

describe(".env.example", () => {
  const envExamplePath = fileURLToPath(new URL("../../../.env.example", import.meta.url));
  const contents = readFileSync(envExamplePath, "utf-8");
  const lines = contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  it("contains only comment lines and NAME= lines with empty values", () => {
    for (const line of lines) {
      expect(line.startsWith("#") || /^[A-Z0-9_]+=$/.test(line)).toBe(true);
    }
  });

  it("lists exactly CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN", () => {
    const names = lines
      .filter((line) => !line.startsWith("#"))
      .map((line) => line.replace(/=$/, ""));
    expect(new Set(names)).toEqual(
      new Set(["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN"]),
    );
  });
});

describe("worker workspace and tooling wiring (007 contact form)", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const read = (path: string) => readFileSync(`${root}${path}`, "utf-8");
  const pkg = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  it("lists worker in pnpm-workspace.yaml packages", () => {
    expect(read("pnpm-workspace.yaml")).toMatch(/^packages:\s*\n\s*-\s*['"]?worker['"]?\s*$/m);
  });

  it("has a private worker package with the Vitest 4 and plugin devDeps", () => {
    const worker = JSON.parse(read("worker/package.json")) as {
      name: string;
      private: boolean;
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(worker.name).toBe("@dcc-web/worker");
    expect(worker.private).toBe(true);
    expect(worker.scripts.test).toContain("vitest run");
    expect(worker.devDependencies.vitest).toMatch(/^4\.1\./);
    expect(worker.devDependencies["@cloudflare/vitest-plugin"]).toMatch(/^1\.3\./);
  });

  it("keeps Vitest 5 at the root and runs wrangler 4.144.0", () => {
    expect(pkg.devDependencies.vitest).toMatch(/^5\./);
    expect(pkg.devDependencies.wrangler).toBe("4.144.0");
  });

  it("gives worker its own strict tsconfig and excludes it from the root one", () => {
    const workerTsconfig = JSON.parse(stripJsonComments(read("worker/tsconfig.json")));
    expect(workerTsconfig.compilerOptions.strict).toBe(true);
    expect(workerTsconfig.compilerOptions.types).toEqual(
      expect.arrayContaining(["./worker-configuration.d.ts"]),
    );
    const rootTsconfig = JSON.parse(stripJsonComments(read("tsconfig.json")));
    expect(rootTsconfig.exclude).toContain("worker");
  });

  it("covers worker/** in ESLint with no-floating-promises on", async () => {
    const configs = (await import("../../../eslint.config.js")).default as unknown as {
      files?: string[];
      rules?: Record<string, unknown>;
      languageOptions?: { parserOptions?: Record<string, unknown> };
    }[];
    const entry = configs.find(
      (c) =>
        c.files?.some((f) => f.startsWith("worker/")) &&
        c.rules?.["@typescript-eslint/no-floating-promises"],
    );
    expect(entry).toBeDefined();
    expect(entry?.rules?.["@typescript-eslint/no-floating-promises"]).toBe("error");
    expect(entry?.languageOptions?.parserOptions?.projectService).toBeTruthy();
  });

  it("wires typecheck, test, types:worker and deploy:production scripts", () => {
    expect(pkg.scripts.typecheck).toBe(
      "astro check && tsc -p worker && wrangler types worker/worker-configuration.d.ts --check",
    );
    expect(pkg.scripts.test).toBe("vitest run && pnpm --filter ./worker test");
    expect(pkg.scripts["types:worker"]).toBe("wrangler types worker/worker-configuration.d.ts");
    expect(pkg.scripts["deploy:production"]).toBeTruthy();
  });
});

describe("contact Worker files", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));

  it("has only additive migrations (no DROP, DELETE or RENAME)", () => {
    const dir = `${root}migrations/`;
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const sql = readFileSync(`${dir}${file}`, "utf-8");
      expect(sql, file).not.toMatch(/\b(DROP|DELETE|RENAME)\b/i);
    }
  });

  it("ignores .cache/ in git", () => {
    const gitignore = readFileSync(`${root}.gitignore`, "utf-8").split("\n");
    expect(gitignore).toContain(".cache/");
  });

  it("provides the e2e env file with public test values only", () => {
    const text = readFileSync(`${root}tests/fixtures/worker/e2e.env`, "utf-8");
    expect(text).toContain("TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA");
    expect(text).toMatch(/^CONTACT_READ_TOKEN=.+/m);
    expect(text).toMatch(/^IP_HASH_SALT=.+/m);
  });
});
