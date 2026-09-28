import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const providersDir = fileURLToPath(new URL("../../../../scripts/setup-check/providers/", import.meta.url));

function read(file: string): string {
  return readFileSync(`${providersDir}${file}`, "utf-8");
}

describe("providers/github.ts is read-only (FR-004)", () => {
  const source = read("github.ts");

  it("never constructs a gh api call using a mutating flag", () => {
    const forbidden = ["-X", "--method", "-f", "-F", "--field", "--raw-field", "--input"];
    for (const flag of forbidden) {
      expect(source, `github.ts must never pass ${flag} to gh api`).not.toContain(`"${flag}"`);
      expect(source, `github.ts must never pass ${flag} to gh api`).not.toContain(`'${flag}'`);
    }
  });

  it("only calls gh with the api subcommand", () => {
    const execCalls = [...source.matchAll(/execFile\(\s*"gh"/g)];
    expect(execCalls.length).toBeGreaterThan(0);
    expect(source).toMatch(/\["api",/);
  });
});

describe("providers/cloudflare.ts exposes only read (list/get/verify) SDK methods (FR-004)", () => {
  const source = read("cloudflare.ts");
  const mutatingVerbs = ["create", "update", "delete", "edit", "patch", "put", "post", "replace"];

  it("never calls a mutating Cloudflare SDK method", () => {
    for (const verb of mutatingVerbs) {
      const pattern = new RegExp(`client\\.[a-zA-Z0-9_.]*\\.${verb}\\(`);
      expect(source, `cloudflare.ts must never call .${verb}(...)`).not.toMatch(pattern);
    }
  });

  it("only calls list, get or verify SDK methods", () => {
    const calls = [...source.matchAll(/client\.[a-zA-Z0-9_.]+\.(\w+)\(/g)].map((m) => m[1]);
    expect(calls.length).toBeGreaterThan(0);
    for (const method of calls) {
      expect(["list", "get", "verify"], `unexpected SDK method .${method}(...)`).toContain(method);
    }
  });
});

describe("providers/http.ts only issues GET/HEAD requests (FR-004)", () => {
  const source = read("http.ts");

  it("never sets a mutating HTTP method", () => {
    const forbidden = ["POST", "PUT", "DELETE", "PATCH"];
    for (const method of forbidden) {
      expect(source, `http.ts must never issue a ${method} request`).not.toMatch(
        new RegExp(`method:\\s*["']${method}["']`),
      );
    }
  });

  it("only sets method to GET or HEAD", () => {
    const methods = [...source.matchAll(/method:\s*["'](\w+)["']/g)].map((m) => m[1]);
    for (const method of methods) {
      expect(["GET", "HEAD"]).toContain(method);
    }
  });
});

describe("every provider module file exists", () => {
  it("providers/ contains github, cloudflare, dns, http, env, fs", () => {
    const files = readdirSync(providersDir);
    for (const name of ["github.ts", "cloudflare.ts", "dns.ts", "http.ts", "env.ts", "fs.ts"]) {
      expect(files, `missing scripts/setup-check/providers/${name}`).toContain(name);
    }
  });
});
