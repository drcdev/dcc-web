// The fixture helper copies only the pictures a copied fixture file uses, so a build of that file
// meets no unused image (src/lib/content/images.ts, the per-entry image folder rule).
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { copyReferencedImages } from "../../../scripts/fixture-images.ts";

const root = mkdtempSync(join(tmpdir(), "fixture-images-test-"));
const from = join(root, "from");
let count = 0;
afterAll(() => rmSync(root, { recursive: true, force: true }));

function setup(files: string[]) {
  const to = join(root, `to-${count++}`);
  mkdirSync(to, { recursive: true });
  for (const file of files) {
    mkdirSync(join(from, file, ".."), { recursive: true });
    writeFileSync(join(from, file), "x");
  }
  return to;
}

describe("copyReferencedImages", () => {
  it("copies only the files the text references", () => {
    const to = setup(["one/a.png", "one/unused.png", "two/b.png"]);
    const text = "src: ./images/one/a.png\n![b](./images/two/b.png)\n";
    const result = copyReferencedImages({ text, sourceId: "one", targetId: "one", fromImages: from, toImages: to });
    expect(result).toBe(text);
    expect(existsSync(join(to, "one/a.png"))).toBe(true);
    expect(existsSync(join(to, "two/b.png"))).toBe(true);
    expect(existsSync(join(to, "one/unused.png"))).toBe(false);
  });

  it("renames the fixture's own folder for a copy under another name and leaves another entry's folder alone", () => {
    const to = setup(["one/a.png", "two/b.png"]);
    const text = "src: ./images/one/a.png\nsrc: ./images/two/b.png\n";
    const result = copyReferencedImages({ text, sourceId: "one", targetId: "renamed", fromImages: from, toImages: to });
    expect(result).toBe("src: ./images/renamed/a.png\nsrc: ./images/two/b.png\n");
    expect(existsSync(join(to, "renamed/a.png"))).toBe(true);
    expect(existsSync(join(to, "one"))).toBe(false);
    expect(existsSync(join(to, "two/b.png"))).toBe(true);
  });

  it("leaves a reference to a missing file as written and copies nothing for it", () => {
    const to = setup(["one/a.png"]);
    const text = "src: ./images/one/missing.png\n";
    const result = copyReferencedImages({ text, sourceId: "one", targetId: "renamed", fromImages: from, toImages: to });
    expect(result).toBe(text);
    expect(existsSync(join(to, "renamed"))).toBe(false);
    expect(existsSync(join(to, "one"))).toBe(false);
  });
});
