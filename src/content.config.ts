// Content collections (docs.astro.build/en/guides/content-collections/).
// `pages`: every Markdown or MDX file in src/content/pages/ is one page. The
// entry id comes from the file path through `addressFromPath()`, so a file name
// becomes its address (specs/003-standalone-pages/research.md R5).
// `posts`: every file at the top of src/content/posts/ is one blog post; the file
// name is its slug (specs/008-blog/research.md R1).
// `projects`: one MDX file per project directly in src/content/projects/; the
// file name is its slug (specs/009-portfolio/data-model.md).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { idFromPath } from "./lib/content/address.ts";
import { assertFrontmatterImagesExist } from "./lib/content/images.ts";
import { assertPostDates } from "./lib/content/post-dates.ts";
import { slugFromPostPath } from "./lib/content/post-address.ts";
import { pageSchema } from "./content/schemas/page.ts";
import { postSchema } from "./content/schemas/post.ts";
import { projectSchema } from "./content/schemas/project.ts";
import { assertProjectImagesExist } from "./lib/content/project-images.ts";
import { slugFromPath } from "./lib/content/project-address.ts";

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

const posts = defineCollection({
  loader: glob({
    // Top level only; `images/` beside the files holds pictures. A `.md` file is matched
    // too, so the post route can fail it with "rename it to .mdx" (R1, R15).
    pattern: "*.{md,mdx}",
    base: "./src/content/posts",
    // Runs for every file before its content is bundled. The date check reads the raw
    // front matter, because the YAML parser rolls an impossible date over (R1).
    generateId: ({ entry, base, data }) => {
      assertPostDates(`src/content/posts/${entry}`, readFileSync(resolve(fileURLToPath(base), entry), "utf-8"));
      assertFrontmatterImagesExist(fileURLToPath(base), entry, data, "post");
      return slugFromPostPath(entry);
    },
  }),
  schema: ({ image }) => postSchema({ image }),
});

// `projects`: one MDX file per project directly in src/content/projects/. The
// entry id is the slug from the file name (specs/009-portfolio/data-model.md).
const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/projects",
    generateId: ({ entry, base, data }) => {
      const slug = slugFromPath(entry);
      assertProjectImagesExist(fileURLToPath(base), entry, data);
      return slug;
    },
  }),
  schema: ({ image }) => projectSchema({ image }),
});

export const collections = { pages, posts, projects };
