import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setupItems } from "../../../scripts/setup-check/items.ts";
import { secretManifest } from "../../../scripts/setup-check/secrets.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function read(path: string): string {
  return readFileSync(`${repoRoot}${path}`, "utf-8");
}

function workflowFiles(): string[] {
  return readdirSync(`${repoRoot}.github/workflows`)
    .filter((f) => f.endsWith(".yml"))
    .map((f) => read(`.github/workflows/${f}`));
}

function stripJsonComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const docsContents = read("docs/setup.md");
const docsAnchors = [...docsContents.matchAll(/^##\s+.*\{#([a-z0-9-]+)\}\s*$/gm)].map((m) => m[1]!);

describe("registry <-> docs/setup.md one-to-one coverage (FR-023)", () => {
  it("every registry item has exactly one docs section", () => {
    for (const item of setupItems) {
      const count = docsAnchors.filter((id) => id === item.id).length;
      expect(count, `expected exactly one docs/setup.md section for ${item.id}, found ${count}`).toBe(1);
    }
  });

  it("every docs section has a matching registry item (no extra sections)", () => {
    const itemIds = new Set(setupItems.map((i) => i.id));
    for (const anchor of docsAnchors) {
      expect(itemIds.has(anchor), `docs/setup.md#${anchor} has no matching registry item`).toBe(true);
    }
  });
});

describe("secret/variable names <-> manifest drift", () => {
  const manifestNames = new Set(secretManifest.map((s) => s.name));

  it("every secret/variable referenced in .github/workflows/*.yml exists in the manifest (GITHUB_TOKEN exempt)", () => {
    for (const contents of workflowFiles()) {
      const refs = [...contents.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]!);
      for (const name of refs) {
        if (name === "GITHUB_TOKEN") continue;
        expect(manifestNames.has(name), `workflow references unknown secret ${name}`).toBe(true);
      }
    }
  });

  it("every name in wrangler.jsonc's vars (if any) exists in the manifest", () => {
    const config = JSON.parse(stripJsonComments(read("wrangler.jsonc"))) as { vars?: Record<string, unknown> };
    for (const name of Object.keys(config.vars ?? {})) {
      expect(manifestNames.has(name), `wrangler.jsonc references unknown var ${name}`).toBe(true);
    }
  });

  it("every name in .env.example exists in the manifest", () => {
    const contents = read(".env.example");
    const names = contents
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"))
      .map((l) => l.replace(/=$/, ""));
    for (const name of names) {
      expect(manifestNames.has(name), `.env.example references unknown name ${name}`).toBe(true);
    }
  });

  it("every local-env manifest entry appears in .env.example", () => {
    const contents = read(".env.example");
    for (const secret of secretManifest.filter((s) => s.store === "local-env")) {
      expect(contents, `.env.example is missing ${secret.name}`).toContain(`${secret.name}=`);
    }
  });

  it("every github-actions manifest entry is referenced by a workflow", () => {
    const workflows = workflowFiles();
    for (const secret of secretManifest.filter((s) => s.store === "github-actions")) {
      expect(
        workflows.some((w) => w.includes(secret.name)),
        `no workflow references github-actions manifest entry ${secret.name}`,
      ).toBe(true);
    }
  });

  it("every gh-keyring manifest entry is named in docs/setup.md and lives in no committed file", () => {
    for (const secret of secretManifest.filter((s) => s.store === "gh-keyring")) {
      expect(docsContents, `docs/setup.md does not name gh-keyring secret ${secret.name}`).toContain(
        secret.name,
      );
      // It must not be committed anywhere as a value-bearing file (.env.example lists names only).
      const envExample = read(".env.example");
      expect(envExample).not.toContain(secret.name);
    }
  });
});

describe("ruleset contexts <-> CI job names", () => {
  it("setup/github-ruleset.json required_status_checks contexts match the ci.yml verify job", () => {
    const ruleset = JSON.parse(read("setup/github-ruleset.json")) as {
      rules: Array<{ type: string; parameters?: { required_status_checks?: Array<{ context: string }> } }>;
    };
    const statusCheckRule = ruleset.rules.find((r) => r.type === "required_status_checks");
    expect(statusCheckRule, "github-ruleset.json must have a required_status_checks rule").toBeDefined();
    const contexts = statusCheckRule!.parameters!.required_status_checks!.map((c) => c.context);

    const ci = read(".github/workflows/ci.yml");
    expect(contexts).toContain("verify");
    expect(ci).toMatch(/^\s{2}verify:/m);
  });
});

describe("CODEOWNERS covers every major-path item", () => {
  it("assigns @drcdev to every path listed in contracts/ci-and-gates.md", () => {
    const codeowners = read(".github/CODEOWNERS");
    const majorPaths = [
      "/.github/",
      "/package.json",
      "/pnpm-lock.yaml",
      "/.nvmrc",
      "/wrangler.jsonc",
      "/astro.config.mjs",
      "/public/_headers",
      "/scripts/ci/",
      "/setup/",
      "/.specify/memory/constitution.md",
      "/.github/CODEOWNERS",
    ];
    for (const path of majorPaths) {
      const line = codeowners.split("\n").find((l) => l.trim().startsWith(path));
      expect(line, `CODEOWNERS is missing ${path}`).toBeDefined();
      expect(line).toContain("@drcdev");
    }
  });
});

describe("registry, docs/setup.md and docs/launch.md agree (011-launch)", () => {
  const launch = read("docs/launch.md");

  it("every --item id named in docs/launch.md is a registry id with a docs/setup.md section", () => {
    const ids = new Set(setupItems.map((i) => i.id));
    const named = new Set([...launch.matchAll(/--item ([a-z0-9-]+)/g)].map((m) => m[1]!));
    expect(named.size).toBeGreaterThan(5);
    for (const id of named) {
      expect(ids.has(id), `${id} is not a registry id`).toBe(true);
      expect(docsAnchors, `docs/setup.md has no section for ${id}`).toContain(id);
    }
  });

  it("docs/setup.md counts the registry and links docs/launch.md, and every launch.md link target exists", () => {
    const intro = docsContents.slice(0, docsContents.indexOf("## 1."));
    expect(intro).toContain(`${setupItems.length}-item registry`);
    expect(intro).toContain("docs/launch.md");
    for (const m of docsContents.matchAll(/docs\/launch\.md#([a-z0-9-]+)/g)) {
      expect(launch, `docs/launch.md has no anchor #${m[1]}`).toContain(`{#${m[1]}}`);
    }
  });
});

describe("contact-form secrets, permissions and .env.example (items 2 and 19 to 25)", () => {
  const byName = (name: string) => secretManifest.find((s) => s.name === name);

  it.each(["TURNSTILE_SECRET_KEY", "CONTACT_READ_TOKEN", "IP_HASH_SALT"])(
    "manifest has the Worker secret %s, used by contact-worker-secrets",
    (name) => {
      const entry = byName(name);
      expect(entry, `${name} missing from the manifest`).toBeDefined();
      expect(entry!.kind).toBe("secret");
      expect(entry!.usedBy).toContain("contact-worker-secrets");
    },
  );

  it("manifest has the site-key build variable", () => {
    const entry = byName("PUBLIC_TURNSTILE_SITE_KEY");
    expect(entry).toBeDefined();
    expect(entry!.kind).toBe("variable");
    expect(entry!.usedBy).toContain("contact-turnstile-site-key");
  });

  it("the token's manifest permissions and the .env.example comment name the three new permissions", () => {
    const permissions = byName("CLOUDFLARE_API_TOKEN")!.permissions ?? "";
    const envExample = read(".env.example").replace(/\n#\s*/g, " ");
    for (const text of [permissions, envExample]) {
      expect(text).toContain("D1 Read");
      expect(text).toContain("Workers Builds Configuration Read");
      expect(text).toContain("Turnstile Sites Read");
    }
    expect(byName("CLOUDFLARE_API_TOKEN")!.usedBy).toEqual(
      expect.arrayContaining(["contact-d1-databases", "contact-turnstile-widget", "contact-preview-builds"]),
    );
  });
});
