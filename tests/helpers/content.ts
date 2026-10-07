// The shared reader of src/content/** for tests. Tests that need to know which posts, projects
// and pages exist, which are drafts, and what they are called read them here, so publishing a
// story or rewriting its copy never needs a test change. One module with no Vitest or Playwright
// import, so both runners load it. It loads synchronously because Playwright builds its
// `for` loops of tests when the file loads.
//
// Astro's `getCollection()` is the site's own reader, but `astro:content` exists only inside
// Astro's runtime. This reuses Astro's own front matter parser and the site's path rules, so the
// tests and the site cannot disagree on a slug or an address.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { seriesIds, topicHref, topics } from "../../src/config/topics.ts";
import { filesUnder } from "./files.ts";
import { addressFromPath, idFromPath, postHref, projectHref, slugFromPath, slugFromPostPath } from "../../src/lib/content/addresses.ts";

// `parseFrontmatter` is an ES module without top-level await, which Node 24 can `require()`
// (nodejs.org/api/modules.html#loading-ecmascript-modules-using-require). It is resolved
// through Astro's package, which depends on it.
const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { parseFrontmatter } = fromAstro("@astrojs/internal-helpers/frontmatter") as {
  parseFrontmatter: (code: string) => { frontmatter: Record<string, unknown>; content: string };
};

const root = fileURLToPath(new URL("../../", import.meta.url));

export type Collection = "pages" | "posts" | "projects";

export interface Entry<D = Record<string, unknown>> {
  collection: Collection;
  /** posts: the file name; projects: the file name; pages: the entry id (`index` for the home page). */
  slug: string;
  /** `/writing/<slug>/`, `/projects/<slug>/`, or the page's own address. */
  address: string;
  /** `draft: true` in the front matter (the schema default is false). */
  draft: boolean;
  /** `visible` in the front matter (the schema default is true). False: not in the production build. */
  visible: boolean;
  title: string;
  /** The parsed front matter; a date is a Date. */
  data: D;
  /** The MDX after the front matter. */
  body: string;
  /** Repository-relative path of the file. */
  file: string;
}

/** Compares two relative paths one segment at a time, so a folder sorts beside its name, not by "/". */
function bySegments(a: string, b: string): number {
  const left = a.split("/");
  const right = b.split("/");
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const order = left[i].localeCompare(right[i]);
    if (order !== 0) return order;
  }
  return left.length - right.length;
}

/** The `.mdx` files below `dir` as paths relative to it: no `_*` file (the template) and no `images/` or `broken/` folder. */
function contentFiles(dir: string): string[] {
  return filesUnder(dir)
    .map((file) => relative(dir, file).split(sep).join("/"))
    .filter((path) => {
      const segments = path.split("/");
      const name = segments.pop()!;
      return /\.mdx?$/.test(name) && !name.startsWith("_") && !segments.some((s) => s === "images" || s === "broken");
    })
    .sort(bySegments);
}

/** Reads one collection. `dir` defaults to src/content/<collection>; pass a fixture folder to read fixtures. */
export function readEntries(collection: Collection, dir = `src/content/${collection}`): Entry[] {
  const base = join(root, dir);
  return contentFiles(base).map((path) => {
    const file = join(base, path);
    const { frontmatter, content } = parseFrontmatter(readFileSync(file, "utf-8"));
    const slug =
      collection === "posts" ? slugFromPostPath(path) : collection === "projects" ? slugFromPath(path) : idFromPath(path);
    const address =
      collection === "posts" ? postHref(slug) : collection === "projects" ? projectHref(slug) : addressFromPath(path);
    return {
      collection,
      slug,
      address,
      draft: frontmatter.draft === true,
      visible: frontmatter.visible !== false,
      title: String(frontmatter.title ?? ""),
      data: frontmatter,
      body: content,
      file: relative(root, file),
    };
  });
}

/** The two landing files in src/content/pages/ (the Writing and Projects menu entries). They are not pages: no route reads them. */
export const landingFileNames = ["writing.mdx", "projects.mdx"] as const;
const isLanding = (entry: Entry): boolean => landingFileNames.some((name) => entry.file === `src/content/pages/${name}`);
const allPageFiles: Entry[] = readEntries("pages");

export const pages: Entry[] = allPageFiles.filter((entry) => !isLanding(entry));
export const landingPages: Entry[] = allPageFiles.filter(isLanding);
export const posts: Entry[] = readEntries("posts");
export const projects: Entry[] = readEntries("projects");

/** The one kitchen-sink draft the tests own (FR-035). */
export const isSample = (post: Entry): boolean => post.slug.startsWith("sample-");
/** Every post except the sample. */
export const realPosts: Entry[] = posts.filter((post) => !isSample(post));

/**
 * The entries a build contains. A production build leaves out draft posts and projects, and
 * pages with `visible: false`; a draft page is built with a notice and noindex. A non-production
 * build contains every entry.
 */
export function inBuild(entries: readonly Entry[], { production }: { production: boolean }): Entry[] {
  return entries.filter((entry) => {
    if (!production) return true;
    return entry.collection === "pages" ? entry.visible : !entry.draft;
  });
}

/** The addresses in the sitemap of a build. A draft or not-visible page is never listed (issue #119, 029). */
export function sitemapPaths({ production }: { production: boolean }): string[] {
  return [
    ...inBuild(pages, { production })
      .filter((page) => page.visible && !page.draft)
      .map((page) => page.address),
    "/writing/",
    "/writing/all/",
    "/projects/",
    ...topics.map((topic) => topicHref(topic.id)),
    ...inBuild(posts, { production }).map((post) => post.address),
    ...inBuild(projects, { production }).map((project) => project.address),
  ];
}

/** A post in the shape src/lib/content/post-order.ts takes. */
export function postSummary(entry: Entry) {
  const data = entry.data as { date: Date; updated?: Date; topics?: string[]; featured?: boolean };
  return {
    slug: entry.slug,
    title: entry.title,
    date: data.date,
    updated: data.updated,
    topics: data.topics ?? [],
    featured: data.featured === true,
    draft: entry.draft,
    href: entry.address,
  };
}

const time = (value: unknown): number => (value instanceof Date ? value.getTime() : 0);

/**
 * The story the template-level checks (layout, focus, progress bar, forced colours, headers, a11y)
 * run on: the newest project with a Build link (`source`, `demo` or `standIn`), else the newest
 * project. The e2e server is a local build, so drafts count.
 */
function pickStory(): Entry {
  const newestFirst = [...projects].sort((a, b) => time(b.data.date) - time(a.data.date));
  const story = newestFirst.find((entry) => entry.data.source || entry.data.demo || entry.data.standIn) ?? newestFirst[0];
  if (!story) throw new Error("tests/helpers/content.ts: src/content/projects has no project to run the story checks on.");
  return story;
}
export const pickedStory: Entry = pickStory();

/** The newest real post whose topics include a series id. */
function pickSeriesPost(): Entry {
  const tagged = realPosts
    .filter((post) => ((post.data.topics as string[] | undefined) ?? []).some((id) => seriesIds.includes(id as never)))
    .sort((a, b) => time(b.data.date) - time(a.data.date));
  const post = tagged[0];
  if (!post) throw new Error("tests/helpers/content.ts: no real post is in a series.");
  return post;
}
export const seriesPost: Entry = pickSeriesPost();
