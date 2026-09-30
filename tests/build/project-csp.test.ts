// US6, FR-041 and FR-047: only a story that embeds a demo gets a `frame-src`, every
// other page keeps the site policy, `public/_headers` is unchanged, and no page
// carries an inline `style` attribute (contracts/pages-dom.md "CSP").
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const FRAME_SRC = "frame-src https://drc.dev https://*.drc.dev";
const policyOf = (html: string) => html.match(/<meta[^>]+http-equiv="content-security-policy"[^>]+content="([^"]*)"/i)?.[1] ?? "";

describe("the page policy of project pages", () => {
  let result: FixtureSiteResult;
  beforeAll(async () => {
    // every-setting embeds its demo; minimal links to a stand-in only.
    result = await buildFixtureSite([], { projects: ["every-setting.mdx", "minimal.mdx"] });
  }, 240_000);
  afterAll(() => result?.cleanup());

  it("builds", () => {
    expect(result.message).toBe("");
  });

  it("gives the embed page frame-src for drc.dev and its subdomains, and no other frame source", () => {
    const policy = policyOf(result.read("projects/every-setting/index.html"));
    expect(policy).toContain(FRAME_SRC);
    expect(policy).toContain("default-src 'self'");
  });

  it("leaves a link-only story on the site policy", () => {
    expect(policyOf(result.read("projects/minimal/index.html"))).not.toContain("frame-src");
  });

  it("leaves the index and other pages on the site policy", () => {
    expect(policyOf(result.read("projects/index.html"))).not.toContain("frame-src");
    expect(policyOf(result.read("about/index.html"))).not.toContain("frame-src");
  });

  it("does not put the frame source in public/_headers", () => {
    const headers = readFileSync(new URL("../../public/_headers", import.meta.url), "utf-8");
    expect(headers).not.toContain("frame-src");
    expect(headers).not.toContain("drc.dev");
  });

  it("has no element with an inline style attribute on the index or any story (FR-047)", () => {
    for (const [path, html] of result.htmlFiles()) {
      if (!path.startsWith("projects/")) continue;
      expect(html, path).not.toMatch(/<[a-z][^>]*\sstyle=/i);
    }
  });

  it("renders the embedded demo as one lazy frame on the embed page only", () => {
    expect(result.read("projects/every-setting/index.html").match(/<iframe\b/g)).toHaveLength(1);
    expect(result.read("projects/minimal/index.html")).not.toContain("<iframe");
  });
});
