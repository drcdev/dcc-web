import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const script: string = pkg.scripts["test:build:content"] ?? "";
const words = script.split(/\s+/);
const positional = words.slice(words.indexOf("build") + 1).filter((a) => !a.startsWith("-"));
const listed = positional.filter((a) => a.startsWith("tests/build/"));

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === "images" ? [] : walk(join(dir, e.name))) : [join(dir, e.name)],
  );
}

function contentSlugs(): string[] {
  const slugs: string[] = [];
  for (const collection of ["pages", "posts", "projects"]) {
    const base = join(root, "src/content", collection);
    for (const file of walk(base)) {
      if (!file.endsWith(".mdx")) continue;
      const slug = file
        .slice(base.length + 1)
        .replace(/\.mdx$/, "")
        .replace(/\/index$/, "");
      if (slug !== "index") slugs.push(slug);
    }
  }
  return [...new Set(slugs)];
}

describe("content-only tier guard", () => {
  it("test:build:content names existing build test files", () => {
    expect(listed.length).toBeGreaterThan(0);
    for (const arg of positional) {
      expect(arg.startsWith("tests/build/"), arg).toBe(true);
    }
    for (const file of listed) {
      expect(file.endsWith(".test.ts"), file).toBe(true);
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  const slugs = contentSlugs();
  const others = readdirSync(join(root, "tests/build"), { recursive: true })
    .map((f) => String(f).split("\\").join("/"))
    .filter((f) => f.endsWith(".test.ts") && !listed.includes(`tests/build/${f}`));

  // A build test reads real content either through the shared helper or by naming an entry's file.
  const readsHelper = (text: string) => /from\s+["'][^"']*helpers\/content(\.ts)?["']/.test(text);

  it("finds real content entries and sees them in the listed files", () => {
    expect(slugs.length).toBeGreaterThan(0);
    // project-template.test.ts runs on a fixed template build, so it reads no real content.
    for (const file of listed.filter((f) => !f.endsWith("project-template.test.ts"))) {
      const text = readFileSync(join(root, file), "utf-8");
      const namesEntry = slugs.some((slug) => text.includes(`${slug}/index.html`) || text.includes(`/${slug}/`));
      expect(readsHelper(text) || namesEntry, `${file} reads no real content: drop it from test:build:content`).toBe(true);
    }
  });

  it("no build test outside test:build:content names or reads a real content entry", () => {
    for (const file of others) {
      const text = readFileSync(join(root, "tests/build", file), "utf-8");
      expect(
        readsHelper(text),
        `${file} reads the content helper: add this file to test:build:content or stop reading real content`,
      ).toBe(false);
      for (const slug of slugs) {
        for (const needle of [`${slug}.mdx`, `${slug}/index.html`, `/${slug}/`]) {
          expect(
            text.includes(needle),
            `${file} names "${needle}": add this file to test:build:content or stop naming real content`,
          ).toBe(false);
        }
      }
    }
  });
});
