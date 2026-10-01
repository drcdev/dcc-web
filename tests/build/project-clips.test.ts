// US6: a valid clip renders with its poster, controls, muted and no autoplay.
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
    expect(video).not.toMatch(/\bloop\b/i);
    expect(html).toContain("Shows the flow from start to finish.");
  });

  it("points the video at a built clip file that exists", () => {
    const src = html.match(/<source[^>]+src="([^"]+)"/)?.[1] ?? "";
    expect(src).toMatch(/^\/_astro\/.+\.webm$/);
    expect(statSync(`${result.dist}${src}`).isFile()).toBe(true);
  });
});
