// public/_redirects (spec 013 contracts/writing-pages.md "Redirects"; research R3; FR-008a):
// the old series topic addresses answer 301 and land on the short series address. Cloudflare
// reads the file top to bottom and uses the first rule that matches; a static rule matches the
// exact path and a trailing `*` takes the rest of the path as `:splat`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pages, realPosts } from "../../helpers/content";

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

/** A rule for an old Ghost address: not a series topic address and not an app privacy address. */
const isGhost = (rule: Rule): boolean => !rule.from.startsWith("/writing/topics/") && !rule.from.startsWith("/projects/");
const withSlash = (path: string): string => (path.endsWith("/") ? path : `${path}/`);
const withoutSlash = (path: string): string => path.replace(/\/$/, "");

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

  // The app store listing for Tempo points at the first drc.dev's
  // per-project privacy addresses, which the project story route cannot serve.
  it.each(["tempo"])("sends the old %s privacy address to the app's privacy page with 301", (slug) => {
    for (const request of [`/projects/${slug}/privacy`, `/projects/${slug}/privacy/`]) {
      expect(resolve(request), request).toEqual({ status: 301, location: `/privacy/${slug}/` });
    }
  });

  // Spec 030: the old Ghost pages and topic pages land on the built page that replaced them.
  it.each([
    ["/drift/", "/writing/drift/"],
    ["/convergence/", "/writing/convergence/"],
    ["/news/", "/writing/"],
    ["/contact-thank-you/", "/contact/"],
    ["/cookie-policy/", "/privacy-policy/"],
  ])("sends the old Ghost address %s to %s with 301, with and without the slash", (from, to) => {
    for (const request of [withSlash(from), withoutSlash(from)]) {
      expect(resolve(request), request).toEqual({ status: 301, location: to });
    }
  });

  it("sends each old Ghost post address to its post under /writing/ and the post is a published real post", () => {
    const postRules = rules().filter((r) => /^\/(drift|convergence|news)\/\d{4}\/[^/]+\/?$/.test(r.from));
    expect(postRules.length).toBeGreaterThan(0);
    const published = new Set(realPosts.filter((p) => !p.draft).map((p) => p.address));
    for (const rule of postRules) {
      expect(rule.status).toBe(301);
      expect(rule.to, rule.from).toMatch(/^\/writing\/[a-z0-9-]+\/$/);
      expect(published.has(rule.to), `${rule.from} -> ${rule.to}`).toBe(true);
      const slug = rule.from.replace(/\/$/, "").split("/").pop();
      expect(rule.to).toBe(`/writing/${slug}/`);
    }
  });

  it("lists every Ghost source in both slash forms with the same built target", () => {
    const ghost = rules().filter(isGhost);
    expect(ghost.length).toBeGreaterThan(0);
    const built = new Set<string>([
      ...pages.map((p) => p.address),
      ...realPosts.filter((p) => !p.draft).map((p) => p.address),
      "/writing/",
      "/writing/drift/",
      "/writing/convergence/",
    ]);
    for (const rule of ghost) {
      expect(resolve(withSlash(rule.from)), rule.from).toEqual({ status: 301, location: rule.to });
      expect(resolve(withoutSlash(rule.from)), rule.from).toEqual({ status: 301, location: rule.to });
      expect(rule.to, rule.from).toMatch(/\/$/);
      expect(rule.from).not.toContain("*");
      expect(built.has(rule.to), `${rule.from} -> ${rule.to}`).toBe(true);
    }
  });

  it("does not touch any other address", () => {
    for (const path of [
      "/tag/x/",
      "/author/x/",
      "/rss/",
      "/ghost/",
      "/drift/2025/x/",
      "/news/2024/x/",
      "/topic/x/",
      "/privacy-policy/",
      "/contact/",
      "/writing/",
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

  it("has only 301 rules with an absolute-path source and a built-address target", () => {
    const all = rules();
    expect(all.length).toBeGreaterThan(0);
    for (const rule of all) {
      expect(rule.status).toBe(301);
      expect(rule.from).toMatch(
        /^\/(writing\/topics\/|projects\/[a-z0-9-]+\/privacy\/?$|(drift|convergence|news)(\/|$)|contact-thank-you|cookie-policy)/,
      );
      expect(rule.to).toMatch(/^\/(writing\/|privacy\/[a-z0-9-]+\/|contact\/|privacy-policy\/)/);
    }
  });

  // The merged Work with me page removes /services/ and /speaking/ with no redirect (FR-007, SC-003).
  it("has no rule for the removed Services and Speaking addresses", () => {
    for (const rule of rules()) {
      expect(rule.from, rule.from).not.toMatch(/^\/(services|speaking)/);
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
