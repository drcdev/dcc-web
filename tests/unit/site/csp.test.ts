// The page content security policy Astro renders as a <meta> tag on every HTML
// page (astro.config.mjs `security.csp`; contracts/http-responses.md "Meta CSP
// on every HTML page"; research R8; FR-024a, FR-024b, FR-024c), and the
// absence of any Web Analytics code or token in the repository (FR-025,
// research R10: Cloudflare injects the beacon at its edge).
import { beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { filesUnder } from "../../helpers/files.ts";

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

  it("allows an external host only from the Web Analytics allow-list", () => {
    const allowed = ["https://static.cloudflareinsights.com", "https://cloudflareinsights.com"];
    // Keywords and hashes ('self', 'none', 'sha256-...') and bare schemes (data:, blob:) are not
    // hosts; every other source, with or without a scheme, is an external host.
    const hosts = [...policy.values()]
      .flat()
      .filter((source) => !/^'.*'$/.test(source) && !/^[a-z][a-z0-9+.-]*:$/i.test(source));
    for (const host of hosts) expect(allowed, host).toContain(host);
  });
});

describe("no Web Analytics code or token in the repository (FR-025)", () => {
  const files = ["src", "public"].flatMap((dir) => filesUnder(join(root, dir)));

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
