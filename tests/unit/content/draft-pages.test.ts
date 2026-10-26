// Unit test for the unlisted-address list (029; FR-008, FR-012). Layer: unit. The helper reads a
// temporary directory, so no build is needed. The build layer (tests/build/drafts.test.ts) covers
// the real sitemap.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { unlistedPageAddresses } from "../../../src/lib/content/draft-pages.ts";

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
