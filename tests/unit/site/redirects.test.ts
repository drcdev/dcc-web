// public/_redirects (spec 013 contracts/writing-pages.md "Redirects"; research R3; FR-008a):
// the old series topic addresses answer 301 and land on the short series address. Cloudflare
// reads the file top to bottom and uses the first rule that matches; a static rule matches the
// exact path and a trailing `*` takes the rest of the path as `:splat`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const redirectsPath = fileURLToPath(new URL("../../../public/_redirects", import.meta.url));

interface Rule {
  from: string;
  to: string;
  status: number;
}

function rules(): Rule[] {
  return readFileSync(redirectsPath, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return { from: from!, to: to!, status: Number(status) };
    });
}

/** The first matching rule's response for a request path, or undefined when no rule matches. */
function resolve(path: string): { status: number; location: string } | undefined {
  for (const rule of rules()) {
    if (rule.from.endsWith("*")) {
      const prefix = rule.from.slice(0, -1);
      if (path.startsWith(prefix)) {
        return { status: rule.status, location: rule.to.replace(":splat", path.slice(prefix.length)) };
      }
    } else if (path === rule.from) {
      return { status: rule.status, location: rule.to };
    }
  }
  return undefined;
}

describe("public/_redirects", () => {
  it.each(["drift", "convergence"])("sends the old %s topic addresses to the short series address with 301", (id) => {
    const expected: Array<[string, string]> = [
      [`/writing/topics/${id}`, `/writing/${id}/`],
      [`/writing/topics/${id}/`, `/writing/${id}/`],
      [`/writing/topics/${id}/2/`, `/writing/${id}/2/`],
      [`/writing/topics/${id}/99/`, `/writing/${id}/99/`],
    ];
    for (const [request, location] of expected) {
      expect(resolve(request), request).toEqual({ status: 301, location });
    }
  });

  // The app store listings for Tempo and Plunge Buddy point at the first drc.dev's
  // per-project privacy addresses, which the project story route cannot serve.
  it.each(["tempo", "plunge-buddy"])("sends the old %s privacy address to the app's privacy page with 301", (slug) => {
    for (const request of [`/projects/${slug}/privacy`, `/projects/${slug}/privacy/`]) {
      expect(resolve(request), request).toEqual({ status: 301, location: `/privacy/${slug}/` });
    }
  });

  it("does not touch any other address", () => {
    for (const path of [
      "/writing/topics/agentic-ai/",
      "/writing/topics/drifting/",
      "/writing/drift/",
      "/writing/convergence/2/",
      "/writing/all/",
      "/projects/tempo/",
      "/projects/focus-pocus/privacy/",
      "/privacy/tempo/",
    ]) {
      expect(resolve(path), path).toBeUndefined();
    }
  });

  it("has only 301 rules with an absolute-path source and a short-address target", () => {
    const all = rules();
    expect(all.length).toBeGreaterThan(0);
    for (const rule of all) {
      expect(rule.status).toBe(301);
      expect(rule.from).toMatch(/^\/(writing\/topics\/|projects\/[a-z0-9-]+\/privacy\/?$)/);
      expect(rule.to).toMatch(/^\/(writing\/(drift|convergence)|privacy\/[a-z0-9-]+)\//);
    }
  });

  it("has no loop: no target is itself redirected", () => {
    for (const rule of rules()) {
      const target = rule.to.replace(":splat", "");
      expect(resolve(target), `${rule.from} -> ${rule.to}`).toBeUndefined();
      expect(resolve(`${target}2/`), `${rule.from} -> ${rule.to}`).toBeUndefined();
    }
  });

  it("stays under Cloudflare's limits (100 static and 100 dynamic rules, 1000 characters per line)", () => {
    const all = rules();
    expect(all.filter((r) => !r.from.includes("*")).length).toBeLessThanOrEqual(100);
    expect(all.filter((r) => r.from.includes("*")).length).toBeLessThanOrEqual(100);
    for (const line of readFileSync(redirectsPath, "utf-8").split("\n")) expect(line.length).toBeLessThan(1000);
  });
});
