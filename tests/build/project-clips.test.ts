// US6 and build-errors.md row 19: a clip is checked before it is bundled (it must
// exist and be 5 MB or less, and the error names the file and the clip path), and
// a valid clip renders with its poster, controls, muted and no autoplay.
import { statSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const clipFixture = new URL("../fixtures/projects/images/clip.webm", import.meta.url);

describe("the committed clip fixture", () => {
  it("is tiny", () => {
    expect(statSync(clipFixture).size).toBeLessThan(10 * 1024);
  });
});

describe("a project with a clip", () => {
  let result: FixtureSiteResult;
  let html = "";
  beforeAll(async () => {
    result = await buildFixtureSite([], { projects: ["every-setting.mdx"] });
    if (result.ok) html = result.read("projects/every-setting/index.html");
  }, 240_000);
  afterAll(() => result?.cleanup());

  it("renders a video with poster and controls, muted, deferred and never autoplaying", () => {
    expect(result.message).toBe("");
    const video = html.match(/<video\b[^>]*>/)?.[0] ?? "";
    expect(video).toContain("controls");
    expect(video).toContain("muted");
    expect(video).toContain("playsinline");
    expect(video).toContain('preload="none"');
    expect(video).toMatch(/poster="\/_astro\/[^"]+"/);
    expect(video).not.toMatch(/autoplay/i);
    expect(html).toContain("Shows the flow from start to finish.");
  });

  it("points the video at a built clip file that exists", () => {
    const src = html.match(/<source[^>]+src="([^"]+)"/)?.[1] ?? "";
    expect(src).toMatch(/^\/_astro\/.+\.webm$/);
    expect(statSync(`${result.dist}${src}`).isFile()).toBe(true);
  });
});

describe("a broken clip", () => {
  it("fails the build for a missing clip, naming the file and the path", async () => {
    const result = await buildFixtureSite([], {
      projects: [{ from: "every-setting.mdx", replace: ["./images/clip.webm", "./images/missing-clip.webm"] }],
    });
    try {
      expect(result.ok).toBe(false);
      expect(result.message).toContain("every-setting");
      expect(result.message).toContain("./images/missing-clip.webm");
    } finally {
      result.cleanup();
    }
  }, 240_000);

  it("fails the build for a clip over 5 MB, naming the file and the path", async () => {
    const result = await buildFixtureSite([], {
      projects: ["every-setting.mdx"],
      write: { "src/content/projects/images/clip.webm": new Uint8Array(5 * 1024 * 1024 + 1) },
    });
    try {
      expect(result.ok).toBe(false);
      expect(result.message).toContain("every-setting");
      expect(result.message).toContain("./images/clip.webm");
      expect(result.message).toContain("5 MB");
    } finally {
      result.cleanup();
    }
  }, 240_000);
});
