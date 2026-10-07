// The addresses of the standalone pages marked `draft: true`. A draft page is built with its
// notice and a noindex tag, so the sitemap leaves it out (astro.config.mjs). Read from the files
// at config load, because the sitemap filter sees only a page's URL. Uses Astro's own front
// matter parser, as tests/helpers/content.ts does.
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { addressFromPath } from "./addresses.ts";

const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { parseFrontmatter } = fromAstro("@astrojs/internal-helpers/frontmatter") as {
  parseFrontmatter: (code: string) => { frontmatter: Record<string, unknown> };
};

/**
 * The addresses (for example `/work-with-me/`) of every page file under `pagesDir` with
 * `draft: true`. A file that does not parse, or whose name breaks the address rules, counts as
 * not a draft: the content collection reports it with its own, clearer error.
 */
export function draftPageAddresses(pagesDir: string): Set<string> {
  const addresses = new Set<string>();
  const files = readdirSync(pagesDir, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
  for (const entry of files) {
    const file = join(entry.parentPath, entry.name);
    const path = relative(pagesDir, file).split(sep).join("/");
    if (!/\.mdx?$/.test(path) || path.split("/").some((segment) => segment.startsWith("_"))) continue;
    try {
      if (parseFrontmatter(readFileSync(file, "utf-8")).frontmatter.draft === true) addresses.add(addressFromPath(path));
    } catch {
      // Left to the content collection to report.
    }
  }
  return addresses;
}
