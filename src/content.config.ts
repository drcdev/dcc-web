// Content collections (docs.astro.build/en/guides/content-collections/).
// `pages`: every Markdown or MDX file in src/content/pages/ is one page. The
// entry id comes from the file path through `addressFromPath()`, so a file name
// becomes its address (specs/003-standalone-pages/research.md R5).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { idFromPath } from "./lib/content/address.ts";
import { pageSchema } from "./content/schemas/page.ts";

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/pages",
    generateId: ({ entry }) => idFromPath(entry),
  }),
  schema: ({ image }) => pageSchema({ image }),
});

export const collections = { pages };
