// Content collections (docs.astro.build/en/guides/content-collections/).
// `pages`: every Markdown or MDX file in src/content/pages/ is one page. The
// entry id comes from the file path through `addressFromPath()`, so a file name
// becomes its address (specs/003-standalone-pages/research.md R5).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { fileURLToPath } from "node:url";
import { idFromPath } from "./lib/content/address.ts";
import { assertFrontmatterImagesExist } from "./lib/content/images.ts";
import { pageSchema } from "./content/schemas/page.ts";

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/pages",
    // Runs for every file before its content is bundled: the id check names
    // bad file names, and the image check names the page of a missing image.
    generateId: ({ entry, base, data }) => {
      const id = idFromPath(entry);
      assertFrontmatterImagesExist(fileURLToPath(base), entry, data);
      return id;
    },
  }),
  schema: ({ image }) => pageSchema({ image }),
});

export const collections = { pages };
