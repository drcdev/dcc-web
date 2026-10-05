// The page content security policy Astro renders as a <meta> tag on every HTML
// page (astro.config.mjs `security.csp`; contracts/http-responses.md "Meta CSP
// on every HTML page"; research R8; FR-024a, FR-024b, FR-024c), and the
// absence of any Web Analytics code or token in the repository (FR-025,
// research R10: Cloudflare injects the beacon at its edge).
import { beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));

type Entry = string | { resource?: string; hash?: string; kind?: string };
interface CspConfig {
  directives?: string[];
  scriptDirective?: { resources?: Entry[]; hashes?: Entry[]; strictDynamic?: boolean };
  styleDirective?: { resources?: Entry[]; hashes?: Entry[] };
}

const entryValue = (entry: Entry): string =>
  typeof entry === "string" ? entry : (entry.resource ?? entry.hash ?? "");

let csp: CspConfig;
/** Every source the config puts in the policy, as one string per directive. */
let policy: Map<string, string[]>;

beforeAll(async () => {
  delete process.env.WORKERS_CI;
  delete process.env.WORKERS_CI_BRANCH;
  const config = (await import("../../../astro.config.mjs")).default as {
    security?: { csp?: CspConfig | boolean };
  };
  const value = config.security?.csp;
  expect(value, "astro.config.mjs must set security.csp to an object").toBeTypeOf("object");
  csp = value as CspConfig;

  policy = new Map();
  for (const directive of csp.directives ?? []) {
    const [name, ...sources] = directive.trim().split(/\s+/);
    policy.set(name!, sources);
  }
  policy.set("script-src", [
    ...(csp.scriptDirective?.resources ?? []).map(entryValue),
    ...(csp.scriptDirective?.hashes ?? []).map((hash) => `'${entryValue(hash)}'`),
  ]);
  policy.set("style-src", [
    ...(csp.styleDirective?.resources ?? []).map(entryValue),
    ...(csp.styleDirective?.hashes ?? []).map((hash) => `'${entryValue(hash)}'`),
  ]);
});

describe("astro.config.mjs security.csp", () => {
  // Guard for the blog (spec FR-053; tasks T090): the site-wide policy equals
  // main's current values exactly, so adding Shiki, env or markdown options to
  // the config can never widen it. Re-pointed at main after the rebase onto the
  // contact form (T079): main's Turnstile sources are added per page through
  // Astro.csp in ContactForm.astro (covered below), not in this config, so the
  // site-wide values are unchanged. Run green before and after every config change.
  it("equals its current values exactly (no new source, no 'unsafe-inline')", () => {
    expect(csp.directives).toEqual([
      "default-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self' https://cloudflareinsights.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]);
    expect(csp.scriptDirective?.resources).toEqual(["'self'", "https://static.cloudflareinsights.com"]);
    expect(csp.scriptDirective?.hashes).toHaveLength(1);
    expect(csp.scriptDirective?.strictDynamic).toBeUndefined();
    expect(csp.styleDirective?.resources).toEqual(["'self'"]);
    expect(csp.styleDirective?.hashes ?? []).toEqual([]);
    expect(Object.keys(csp).sort()).toEqual(["directives", "scriptDirective", "styleDirective"]);
  });

  it.each([
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "https://static.cloudflareinsights.com"]],
    ["style-src", ["'self'"]],
    ["img-src", ["'self'", "data:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'", "https://cloudflareinsights.com"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
  ])("%s allows exactly the listed sources (plus hashes)", (name, expected) => {
    const sources = policy.get(name);
    expect(sources, `${name} is missing`).toBeDefined();
    const nonHash = sources!.filter((source) => !/^'sha(256|384|512)-/.test(source));
    expect(nonHash.sort()).toEqual([...expected].sort());
  });

  // specs/022 T023: the questions panel calls its own origin, which `connect-src 'self'` already
  // allows, so the policy needs no source for it.
  it("lets the questions panel reach /api/questions through connect-src 'self' alone", () => {
    expect(policy.get("connect-src")).toContain("'self'");
    for (const sources of policy.values()) {
      for (const source of sources) expect(source).not.toMatch(/api\/questions|workers\.dev|ai\./);
    }
  });

  it("hashes the inline pre-paint theme script exactly as it is rendered", () => {
    const source = readFileSync(join(root, "src/scripts/theme-init.js"), "utf-8");
    const hash = `sha256-${createHash("sha256").update(source).digest("base64")}`;
    const hashes = (csp.scriptDirective?.hashes ?? []).map(entryValue);
    expect(hashes).toContain(hash);
  });

  it("contains no forbidden or development-only source", () => {
    const all = [...policy.entries()].flatMap(([name, sources]) => [name, ...sources]).join(" ");
    for (const forbidden of [
      "unsafe-inline",
      "unsafe-eval",
      "unsafe-hashes",
      "web3forms",
      "jsdelivr",
      "supabase",
      "localhost",
      "127.0.0.1",
      "ws:",
      "wss:",
      "http:",
    ]) {
      expect(all, forbidden).not.toContain(forbidden);
    }
    for (const sources of policy.values()) {
      expect(sources).not.toContain("https:");
      expect(sources).not.toContain("*");
    }
  });

  it("allows no origin beyond the site itself and the two Web Analytics hosts", () => {
    const origins = [...policy.values()].flat().filter((source) => /^[a-z]+:\/\//.test(source));
    expect(new Set(origins)).toEqual(
      new Set(["https://static.cloudflareinsights.com", "https://cloudflareinsights.com"]),
    );
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("no Web Analytics code or token in the repository (FR-025)", () => {
  const files = ["src", "public"].flatMap((dir) => walk(join(root, dir)));

  it.each(["beacon.min.js", "data-cf-beacon", "cloudflareinsights.com/cdn-cgi"])(
    "no file under src/ or public/ contains %s",
    (needle) => {
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        if (/\.(png|jpe?g|webp|avif|gif|ico|woff2?)$/i.test(file)) continue;
        expect(readFileSync(file, "utf-8"), file).not.toContain(needle);
      }
    },
  );
});

describe("contact page CSP additions (contracts/contact-page.md 'CSP')", () => {
  const source = (path: string) => readFileSync(join(root, path), "utf-8");

  it("adds the Turnstile script and frame sources through Astro.csp", () => {
    const helper = source("src/components/sections/contact-csp.ts");
    expect(helper).toContain('insertScriptResource("https://challenges.cloudflare.com")');
    expect(helper).toContain('insertDirective("frame-src https://challenges.cloudflare.com")');
  });

  it("asks for them from the form and from the page route when the body holds the form", () => {
    expect(source("src/components/sections/ContactForm.astro")).toContain("allowTurnstile(Astro.csp)");
    expect(source("src/pages/[...slug].astro")).toMatch(/<ContactForm[\s\S]*allowTurnstile\(Astro\.csp\)/);
  });

  it("only the contact form and its helper name the Turnstile host, so other pages keep the site-wide policy", () => {
    const users = walk(join(root, "src")).filter(
      (file) => /\.(astro|ts|js|mdx?)$/.test(file) && readFileSync(file, "utf-8").includes("challenges.cloudflare.com"),
    );
    expect(users.map((file) => file.slice(root.length)).sort()).toEqual([
      "src/components/sections/ContactForm.astro",
      "src/components/sections/contact-csp.ts",
    ]);
  });
});
