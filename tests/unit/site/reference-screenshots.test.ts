import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const refDir = fileURLToPath(new URL("../../../tests/reference/ghost", import.meta.url));

const pages = ["home", "post", "about"] as const;
const widths = ["phone", "desktop"] as const;
const themes = ["dark", "light"] as const;

function expectedFiles(): string[] {
  const files: string[] = [];
  for (const page of pages) {
    for (const width of widths) {
      for (const theme of themes) {
        files.push(`${page}-${width}-${theme}.png`);
      }
    }
  }
  return files;
}

function readPngIhdrWidth(filePath: string): number {
  const buf = readFileSync(filePath);
  // PNG signature is 8 bytes, then an 8-byte chunk header (length + "IHDR"),
  // then the IHDR data starts with a 4-byte width, big-endian.
  return buf.readUInt32BE(16);
}

function isValidPngSignature(filePath: string): boolean {
  const buf = readFileSync(filePath);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 8) return false;
  return sig.every((byte, i) => buf[i] === byte);
}

describe("tests/reference/ghost/", () => {
  it("exists", () => {
    expect(existsSync(refDir)).toBe(true);
  });

  const files = existsSync(refDir) ? readdirSync(refDir) : [];

  it("holds exactly the 12 expected PNG files plus README.md", () => {
    const expected = new Set([...expectedFiles(), "README.md"]);
    expect(new Set(files)).toEqual(expected);
  });

  it.each(expectedFiles())("%s is a valid PNG", (filename) => {
    const filePath = `${refDir}/${filename}`;
    expect(existsSync(filePath)).toBe(true);
    expect(isValidPngSignature(filePath)).toBe(true);
  });

  for (const page of pages) {
    for (const theme of themes) {
      it(`${page}-phone-${theme}.png has IHDR width 390`, () => {
        const filePath = `${refDir}/${page}-phone-${theme}.png`;
        expect(existsSync(filePath)).toBe(true);
        expect(readPngIhdrWidth(filePath)).toBe(390);
      });

      it(`${page}-desktop-${theme}.png has IHDR width 1280`, () => {
        const filePath = `${refDir}/${page}-desktop-${theme}.png`;
        expect(existsSync(filePath)).toBe(true);
        expect(readPngIhdrWidth(filePath)).toBe(1280);
      });
    }
  }

  it("README.md exists and names the capture date and the post URL used", () => {
    const readmePath = `${refDir}/README.md`;
    expect(existsSync(readmePath)).toBe(true);
    const contents = existsSync(readmePath) ? readFileSync(readmePath, "utf-8") : "";
    // A capture date: an ISO-like date (YYYY-MM-DD).
    expect(contents).toMatch(/\d{4}-\d{2}-\d{2}/);
    // The post URL used: a doncoleman.ca post path.
    expect(contents).toMatch(/\/(drift|convergence|news)\/\d{4}\//);
  });
});
