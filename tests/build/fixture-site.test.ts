// Smoke test for the fixture-site harness (tests/build/fixture-site.ts): it
// builds a copy of the site, runs the content layer against fixture pages, and
// reports failures as text. Fails until the content layer exists.
import { existsSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

describe("fixture-site harness", () => {
  it("syncs a valid page file into a temporary site", async () => {
    result = await buildFixtureSite(["workshops.mdx"], { mode: "sync" });
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
    expect(existsSync(`${result.root}/src/content/pages/workshops.mdx`)).toBe(true);
  });

  it("reports a broken page file as a failure that names the file and the problem", async () => {
    result = await buildFixtureSite(["broken/01-no-title.mdx"], { mode: "sync" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("01-no-title");
    expect(result.message).toContain("title");
  });

  it("places a file at the `to` path", async () => {
    result = await buildFixtureSite([{ from: "workshops.mdx", to: "legal/index.mdx" }], { mode: "sync" });
    expect(existsSync(`${result.root}/src/content/pages/legal/index.mdx`)).toBe(true);
    expect(result.ok).toBe(true);
  });

  it("removes the temporary site on cleanup", async () => {
    result = await buildFixtureSite(["workshops.mdx"], { mode: "sync" });
    const { root } = result;
    result.cleanup();
    expect(existsSync(root)).toBe(false);
  });
});
