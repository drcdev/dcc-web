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
import { assertNoTwin, idFromPath, slugFromPath, slugFromPostPath } from "./lib/content/addresses.ts";
import { assertImagesExist } from "./lib/content/images.ts";
import { assertHomeVisible, assertLandingBody, bodyAfterFrontMatter } from "./lib/content/page-flags.ts";
import { assertNowDate } from "./lib/content/now-file.ts";
import { assertPostDates } from "./lib/content/post-dates.ts";
import { assessmentSchema } from "./content/schemas/assessment.ts";
import { landingSchema, pageSchema } from "./content/schemas/page.ts";
import { nowSchema } from "./content/schemas/now.ts";
import { readingPathSchema } from "./content/schemas/reading-path.ts";
import { postSchema } from "./content/schemas/post.ts";
import { projectSchema } from "./content/schemas/project.ts";

const pages = defineCollection({
  loader: glob({
    // The two landing files are their own collection, so no page route reads them (029).
    pattern: ["**/*.{md,mdx}", "!writing.{md,mdx}", "!projects.{md,mdx}"],
    base: "./src/content/pages",
    // Runs for every file before its content is bundled: the id check names
    // bad file names, the twin check names two files with one address, and the image
    // check names the page of a missing image.
    generateId: ({ entry, base, data }) => {
      const id = idFromPath(entry);
      assertNoTwin("page", fileURLToPath(base), entry);
      assertImagesExist("page", fileURLToPath(base), entry, data);
      assertHomeVisible(id, entry, data);
      return id;
    },
  }),
  schema: ({ image }) => pageSchema({ image }),
});

// `landing`: the Writing and Projects menu entries. The files hold settings only; the pages are
// built by code routes (specs/029-page-visible-draft/contracts/page-settings.md).
const landing = defineCollection({
  loader: glob({
    pattern: "{writing,projects}.{md,mdx}",
    base: "./src/content/pages",
    generateId: ({ entry, base }) => {
      const dir = fileURLToPath(base);
      assertNoTwin("page", dir, entry);
      assertLandingBody(entry, bodyAfterFrontMatter(readFileSync(resolve(dir, entry), "utf-8")));
      return idFromPath(entry);
    },
  }),
  schema: landingSchema,
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
      assertNoTwin("post", fileURLToPath(base), entry);
      assertPostDates(`src/content/posts/${entry}`, readFileSync(resolve(fileURLToPath(base), entry), "utf-8"));
      assertImagesExist("post", fileURLToPath(base), entry, data);
      return slugFromPostPath(entry);
    },
  }),
  schema: ({ image }) => postSchema({ image }),
});

// `projects`: one MDX file per project directly in src/content/projects/. The
// entry id is the slug from the file name (specs/009-portfolio/data-model.md).
const projects = defineCollection({
  loader: glob({
    // A file whose name starts with `_` (the writer's template) is not a project.
    pattern: ["**/*.{md,mdx}", "!**/_*"],
    base: "./src/content/projects",
    generateId: ({ entry, base, data }) => {
      const slug = slugFromPath(entry);
      assertNoTwin("project", fileURLToPath(base), entry);
      assertImagesExist("project", fileURLToPath(base), entry, data);
      return slug;
    },
  }),
  schema: ({ image }) => projectSchema({ image }),
});

// `assessments`: one YAML file per self-assessment in src/content/assessments/; the file name is
// the id a post names in its components (specs/037-wayfinder-self-assessment/data-model.md).
const assessments = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/assessments" }),
  schema: assessmentSchema,
});

// `now`: the one Now file, src/content/now/now.md: the date and four topics in its front matter and
// the "open to" line as its body. The date check reads the raw text (specs/040-home-now-start-here).
const now = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: "./src/content/now",
    generateId: ({ entry, base }) => {
      assertNowDate(`src/content/now/${entry}`, readFileSync(resolve(fileURLToPath(base), entry), "utf-8"));
      return entry.replace(/\.md$/, "");
    },
  }),
  schema: nowSchema(),
});

// `readingPaths`: one YAML file per "Start here" path in src/content/reading-paths/. The id is the file
// name. Rules that span files (missing items, duplicates, the four-path limit) run in
// src/lib/reading-paths.ts when the home page is built (contracts/build-errors.md R04 to R07).
const readingPaths = defineCollection({
  loader: glob({ pattern: "*.{yaml,yml}", base: "./src/content/reading-paths" }),
  schema: readingPathSchema(),
});

export const collections = { pages, landing, posts, projects, assessments, now, readingPaths };
