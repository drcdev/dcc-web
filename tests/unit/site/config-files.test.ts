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

  it("keeps production off workers.dev and version URLs (#89)", () => {
    expect(config.workers_dev).toBe(false);
    expect(config.preview_urls).toBe(false);
  });

  it("never sets ALLOW_TURNSTILE_TESTING in production vars", () => {
    expect(config.vars ?? {}).not.toHaveProperty("ALLOW_TURNSTILE_TESTING");
  });

  it("reaches the e2e Worker's flag only through the wrangler dev --var, never the generated config", () => {
    const generator = readFileSync(
      fileURLToPath(new URL("../../../scripts/e2e-wrangler-config.ts", import.meta.url)),
      "utf-8",
    );
    expect(generator).not.toContain("ALLOW_TURNSTILE_TESTING");
    expect(generator).not.toMatch(/\.vars\b/);
  });

  it("runs the Worker only for /api/* (Principle VIII)", () => {
    expect(config.main).toBe("worker/src/index.ts");
    expect(config.assets?.run_worker_first).toEqual(["/api/*"]);
  });

  // The D1 assertions check shape and internal consistency, never live ids or names, so they hold
  // before and after the database swap commit (W01).
  it("binds exactly one database as DB in each environment, the preview named like production plus -preview", () => {
    expect(config.d1_databases).toHaveLength(1);
    expect(config.d1_databases[0]).toMatchObject({ binding: "DB", migrations_dir: "migrations" });
    const production = config.d1_databases[0].database_name;
    expect(typeof production).toBe("string");
    expect(production.length).toBeGreaterThan(0);
    const preview = config.env?.preview;
    expect(preview?.d1_databases).toHaveLength(1);
    expect(preview.d1_databases[0]).toMatchObject({ binding: "DB", migrations_dir: "migrations" });
    expect(preview.d1_databases[0].database_name).toBe(`${production}-preview`);
    expect(JSON.stringify(config).match(/"database_name"/g)).toHaveLength(2);
  });

  it("never makes the AI binding remote in either environment", () => {
    expect(config.ai).not.toHaveProperty("remote");
    expect(config.env.preview.ai ?? {}).not.toHaveProperty("remote");
  });

  it("has two different database ids, each a real UUID (no placeholder)", () => {
    // Don created both databases on 2026-09-29 (setup item 18); placeholders no longer pass.
    const isAllowed = (id: unknown) =>
      typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) &&
      !/^0{8}-0{4}-0{4}-0{4}-0{12}$|^00000000-0000-0000-0000-00000000000[0-9]$/.test(id);
    const production = config.d1_databases[0].database_id;
    const preview = config.env.preview.d1_databases[0].database_id;
    expect(isAllowed(production)).toBe(true);
    expect(isAllowed(preview)).toBe(true);
    expect(production).not.toBe(preview);
  });

  it("applies migrations by the DB binding in the deploy scripts and the e2e config (W04)", () => {
    const read = (rel: string) => readFileSync(fileURLToPath(new URL(`../../../${rel}`, import.meta.url)), "utf-8");
    const applied = (text: string) => [...text.matchAll(/"apply",\s*"([^"]+)"|migrations apply ([\w-]+)/g)].map((m) => m[1] ?? m[2]);
    expect(applied(read("scripts/deploy/production.ts"))).toEqual(["DB"]);
    expect(applied(read("scripts/deploy/preview.ts"))).toEqual(["DB"]);
    expect(applied(read("playwright.config.ts"))).toEqual(["DB"]);
    expect(read("scripts/deploy/preview.ts")).toContain('"--env", "preview"');
  });

  it("schedules at least one cron trigger (the retention job) in both environments", () => {
    expect(config.triggers?.crons?.length).toBeGreaterThan(0);
    expect(config.env.preview.triggers?.crons?.length).toBeGreaterThan(0);
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

});

// Importing these configs pulls in Astro, Vite or ESLint, which takes over 5 s when the machine is loaded.
const HEAVY_IMPORT_TIMEOUT = 60_000;

describe("astro.config.mjs", () => {
  it("sets no adapter and no server output (static by default, Principle V)", async () => {
    const config = (await import("../../../astro.config.mjs")).default;
    expect(config.adapter).toBeUndefined();
    expect(config.output).not.toBe("server");
  }, HEAVY_IMPORT_TIMEOUT);
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
  }, HEAVY_IMPORT_TIMEOUT);
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

  it("never auto-updates snapshots (a missing baseline fails, FR-005b)", async () => {
    const config = await loadConfig();
    expect(config.updateSnapshots).toBe("none");
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

  it("runs every verify:quick member as a defined script that verify also runs", () => {
    const runs = (script: string): string[] => [...script.matchAll(/pnpm run (\S+)/g)].map((m) => m[1] as string);
    const members = runs(pkg.scripts["verify:quick"]);
    expect(members.length).toBeGreaterThan(0);
    const verifyMembers = runs(pkg.scripts.verify);
    const testMembers = runs(pkg.scripts.test);
    for (const name of members) {
      expect(pkg.scripts[name], `${name} is a defined script`).toBeTypeOf("string");
      // verify runs a member directly, or through test (vitest run covers test:unit).
      const direct = verifyMembers.includes(name);
      const viaTest = verifyMembers.includes("test") && (testMembers.includes(name) || name === "test:unit");
      expect(direct || viaTest, `${name} is run by verify`).toBe(true);
    }
  });

  it("runs test:e2e with no --project filter, so every Playwright project runs", () => {
    expect(pkg.scripts["test:e2e"]).toMatch(/^playwright test/);
    expect(pkg.scripts["test:e2e"]).not.toMatch(/--project/);
  });

  it("keeps test:a11y as a documented manual command", () => {
    expect(pkg.scripts["test:a11y"]).toBeTypeOf("string");
  });

  const projectFlags = (script: string): string[] =>
    [...script.matchAll(/--project[= ](\S+)/g)].map((m) => m[1] as string);

  it("covers every Vitest project from test:unit and test:build", async () => {
    const source = readFileSync(fileURLToPath(new URL("../../../vitest.config.ts", import.meta.url)), "utf-8");
    const declared = [...source.matchAll(/\bname:\s*"([^"]+)"/g)].map((m) => m[1]).sort();
    const scripted = [...projectFlags(pkg.scripts["test:unit"]), ...projectFlags(pkg.scripts["test:build"])].sort();
    expect(declared.length).toBeGreaterThan(0);
    expect(scripted).toEqual(declared);
  });

  it("covers every Playwright project exactly once across test:e2e:parallel and test:budget", async () => {
    const config = (await import("../../../playwright.config.ts")).default as unknown as {
      projects: { name: string }[];
    };
    const declared = config.projects.map((p) => p.name).sort();
    const scripted = [
      ...projectFlags(pkg.scripts["test:e2e:parallel"]),
      ...projectFlags(pkg.scripts["test:budget"]),
    ].sort();
    expect(scripted).toEqual(declared);
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

});

describe("worker workspace and tooling wiring (007 contact form)", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const read = (path: string) => readFileSync(`${root}${path}`, "utf-8");
  const pkg = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  it("gives worker a strict tsconfig", () => {
    const workerTsconfig = JSON.parse(stripJsonComments(read("worker/tsconfig.json")));
    expect(workerTsconfig.compilerOptions.strict).toBe(true);
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
  }, HEAVY_IMPORT_TIMEOUT);

  it("typechecks the worker and checks its generated types", () => {
    expect(pkg.scripts.typecheck).toContain("tsc -p worker");
    expect(pkg.scripts.typecheck).toMatch(/wrangler types .*--check/);
    expect(pkg.scripts["types:worker"]).toBeTypeOf("string");
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
    expect(text).not.toContain("ALLOW_TURNSTILE_TESTING");
  });
});
