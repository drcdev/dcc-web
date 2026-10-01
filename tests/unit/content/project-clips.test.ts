// The clip check (data-model.md invariant 5, build-errors.md row 19) and the
// page-policy helper for embedded demos (research R10).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { allowDemoFrames } from "../../../src/lib/content/demo-csp.ts";
import { MAX_CLIP_BYTES, assertProjectImagesExist } from "../../../src/lib/content/project-images.ts";

const root = mkdtempSync(join(tmpdir(), "project-clips-"));
mkdirSync(join(root, "images"));
writeFileSync(join(root, "images/ok.webm"), new Uint8Array(1024));
writeFileSync(join(root, "images/exact.webm"), new Uint8Array(MAX_CLIP_BYTES));
writeFileSync(join(root, "images/big.mp4"), new Uint8Array(MAX_CLIP_BYTES + 1));
writeFileSync(join(root, "images/poster.png"), new Uint8Array(10));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const withClip = (src: string) => ({ visuals: { clip: { kind: "clip", src, poster: "./images/poster.png" } } });

describe("assertProjectImagesExist for clips", () => {
  it("accepts a clip that exists and is within 5 MB", () => {
    expect(() => assertProjectImagesExist(root, "p.mdx", withClip("./images/ok.webm"))).not.toThrow();
    expect(() => assertProjectImagesExist(root, "p.mdx", withClip("./images/exact.webm"))).not.toThrow();
  });

  it("names the file and the path of a missing clip", () => {
    expect(() => assertProjectImagesExist(root, "p.mdx", withClip("./images/none.webm"))).toThrow(
      /src\/content\/projects\/p\.mdx.*\.\/images\/none\.webm/s,
    );
  });

  it("names the file, the path and the limit of a clip over 5 MB", () => {
    expect(() => assertProjectImagesExist(root, "p.mdx", withClip("./images/big.mp4"))).toThrow(
      /src\/content\/projects\/p\.mdx.*\.\/images\/big\.mp4.*5 MB/s,
    );
  });

  it("row 17: names the project file and the path of a missing image", () => {
    const run = () => assertProjectImagesExist(root, "p.mdx", { visual: { src: "./images/nope.png" } });
    expect(run).toThrow("Project file src/content/projects/p.mdx");
    expect(run).toThrow("./images/nope.png");
  });

  it("does not size-limit images", () => {
    writeFileSync(join(root, "images/huge.png"), new Uint8Array(MAX_CLIP_BYTES + 1));
    expect(() => assertProjectImagesExist(root, "p.mdx", { visual: { src: "./images/huge.png" } })).not.toThrow();
  });
});

describe("allowDemoFrames", () => {
  it("asks for frames from drc.dev and its subdomains only", () => {
    const insertDirective = vi.fn();
    allowDemoFrames({ insertDirective });
    expect(insertDirective).toHaveBeenCalledExactlyOnceWith("frame-src https://drc.dev https://*.drc.dev");
  });

  it("does nothing when the page policy is off", () => {
    expect(() => allowDemoFrames(undefined)).not.toThrow();
  });
});
