// Unit tests for the page flag checks and the unlisted-address list (029; contract rows V5, V8;
// FR-008, FR-010, FR-012). Layer: unit. The helpers are pure, so no build is needed. The build
// layer (tests/build/drafts.test.ts) covers the wiring and the real sitemap.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertHomeVisible, assertLandingBody } from "../../../src/lib/content/page-flags.ts";
import { unlistedPageAddresses } from "../../../src/lib/content/draft-pages.ts";

describe("assertHomeVisible (V5)", () => {
  it("refuses visible: false for the home page, naming the file", () => {
    expect(() => assertHomeVisible("index", "index.mdx", { visible: false })).toThrow(
      /Page file src\/content\/pages\/index\.mdx: .*home page/,
    );
  });

  it("allows a visible or draft home page, and any other page being hidden", () => {
    expect(() => assertHomeVisible("index", "index.mdx", { visible: true })).not.toThrow();
    expect(() => assertHomeVisible("index", "index.mdx", { draft: true })).not.toThrow();
    expect(() => assertHomeVisible("index", "index.mdx", {})).not.toThrow();
    expect(() => assertHomeVisible("example", "example.mdx", { visible: false })).not.toThrow();
  });
});

describe("assertLandingBody (V8)", () => {
  it("refuses a landing file with a body, naming the file", () => {
    expect(() => assertLandingBody("example.mdx", "Some text\n")).toThrow(
      /Page file src\/content\/pages\/example\.mdx: .*no body/,
    );
  });

  it("allows an empty or whitespace-only body", () => {
    expect(() => assertLandingBody("example.mdx", "")).not.toThrow();
    expect(() => assertLandingBody("example.mdx", " \n\n  \n")).not.toThrow();
  });
});

describe("unlistedPageAddresses", () => {
  it("lists draft and not-visible pages and skips visible pages and landing files", () => {
    const dir = mkdtempSync(join(tmpdir(), "pages-"));
    mkdirSync(join(dir, "nested"));
    const front = (lines: string) => `---\ntitle: T\ndescription: D\n${lines}---\n\nBody\n`;
    writeFileSync(join(dir, "shown.mdx"), front(""));
    writeFileSync(join(dir, "drafted.mdx"), front("draft: true\n"));
    writeFileSync(join(dir, "hidden.mdx"), front("visible: false\n"));
    writeFileSync(join(dir, "nested", "both.mdx"), front("visible: false\ndraft: true\n"));
    const nav = "nav:\n  location: header\n  position: 4\n";
    writeFileSync(join(dir, "writing.mdx"), `---\ntitle: W\nvisible: false\n${nav}---\n`);
    writeFileSync(join(dir, "projects.mdx"), `---\ntitle: P\ndraft: true\n${nav}---\n`);
    expect([...unlistedPageAddresses(dir)].sort()).toEqual(["/drafted/", "/hidden/", "/nested/both/"]);
  });
});
