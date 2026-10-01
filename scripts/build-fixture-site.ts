// Builds the fixture site used by the browser tests: a copy of this
// repository's site with tests/fixtures/pages/sections.mdx added as an extra
// page (specs/003-standalone-pages/tasks.md, T004, T005) and with generated
// blog posts added, so pagination has a second page to test
// (specs/008-blog/tasks.md, T026). Two fixture posts from tests/fixtures/posts/valid/ are added
// too: a post with no feature image and a post with a very long title, the cases the removed
// sample posts used to cover (FIXTURE_POSTS). Written to .cache/fixture-site/dist.
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, crc32 } from "node:zlib";
import { build } from "astro";

/** A generated post: its file text and its small feature image. */
export interface GeneratedPost {
  slug: string;
  /** The whole post file: front matter and body. */
  source: string;
  image: { name: string; data: Uint8Array };
}

/**
 * Fixture posts copied from tests/fixtures/posts/valid/ (with the pictures in
 * tests/fixtures/posts/images/): a text-only post (no feature image, 2026-08-10) and a post
 * with a very long title holding an unbroken word (2026-08-20). tests/e2e/blog-fixtures.spec.ts
 * checks them on the served fixture site.
 */
export const FIXTURE_POSTS = ["text-only.mdx", "long-title.mdx"] as const;

/** A free-form topic id (not in src/config/topics.ts) carried by the oldest generated post. */
export const FREE_FORM_TOPIC = "cloud-cost";

/** The fewest generated posts: 13 means a full first page of 12 and a second page of one. */
const MINIMUM_POSTS = 13;

function chunk(type: string, data: Uint8Array): Uint8Array {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body) >>> 0, body.length + 4);
  return out;
}

/** A small solid-colour PNG, written by hand so the fixture site needs no image tool. */
function solidPng(width: number, height: number, [r, g, b]: [number, number, number]): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8 bits, RGB, no interlace
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x += 1) row.set([r, g, b], 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * At least 13 valid, published posts with distinct dates, each with a small generated feature
 * image. Every post carries `agentic-ai`, so that topic has a second page, and most carry a second
 * topic so the other topics have posts too.
 */
export function generateFixturePosts(count = MINIMUM_POSTS): GeneratedPost[] {
  const total = Math.max(count, MINIMUM_POSTS);
  const second = ["compliant-data", "technology-teams", "healthcare-leadership"];
  return Array.from({ length: total }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const slug = `fixture-post-${number}`;
    const date = new Date(Date.UTC(2026, 5, 30 - index)).toISOString().slice(0, 10);
    // The oldest post also carries a free-form topic, so the fixture site has a free-form topic page.
    const topics = [
      "agentic-ai",
      ...(index % 4 === 3 ? [] : [second[index % second.length]!]),
      ...(index === total - 1 ? [FREE_FORM_TOPIC] : []),
    ];
    const name = `${slug}.png`;
    const hue = (index * 47) % 255;
    const source = [
      "---",
      `title: Fixture post ${number}`,
      `summary: A generated post used to test listings and pagination, number ${number}.`,
      `date: ${date}`,
      "topics:",
      ...topics.map((topic) => `  - ${topic}`),
      "featureImage:",
      `  src: ./images/${name}`,
      `  alt: A plain coloured rectangle for fixture post ${number}`,
      ...(index === 0 ? ["featured: true"] : []),
      "---",
      "",
      `This is fixture post ${number}. It is generated for the tests and never published.`,
      "",
      "## A heading",
      "",
      "A few more words, so the post has a body and a reading time.",
      "",
    ].join("\n");
    return { slug, source, image: { name, data: solidPng(480, 270, [hue, 200 - (hue % 120), 255 - hue]) } };
  });
}

async function buildSite(): Promise<void> {
  const repoRoot = fileURLToPath(new URL("../", import.meta.url));
  const siteRoot = resolve(repoRoot, ".cache/fixture-site");
  const fixture = resolve(repoRoot, "tests/fixtures/pages/sections.mdx");

  rmSync(siteRoot, { recursive: true, force: true });
  mkdirSync(siteRoot, { recursive: true });

  // Finder metadata stays out of the copy. Passing a filter also keeps Node on its
  // JavaScript copy: the native directory copy it uses without one fails with
  // EACCES on a Docker Desktop bind mount, which is where
  // scripts/visual-baselines-linux.sh builds this site.
  const copyOptions = { recursive: true, filter: (source: string) => !source.endsWith(".DS_Store") };

  for (const entry of ["src", "public", "setup", "astro.config.mjs", "tsconfig.json", "package.json"]) {
    cpSync(resolve(repoRoot, entry), resolve(siteRoot, entry), copyOptions);
  }
  // Dependencies resolve through the repository's node_modules.
  symlinkSync(resolve(repoRoot, "node_modules"), resolve(siteRoot, "node_modules"), "dir");

  // The contact form imports the shared limits from the Worker package.
  mkdirSync(resolve(siteRoot, "worker/src/contact"), { recursive: true });
  cpSync(resolve(repoRoot, "worker/src/contact/rules.ts"), resolve(siteRoot, "worker/src/contact/rules.ts"));

  if (existsSync(fixture)) {
    mkdirSync(resolve(siteRoot, "src/content/pages"), { recursive: true });
    cpSync(fixture, resolve(siteRoot, "src/content/pages/sections.mdx"));
    const images = resolve(repoRoot, "tests/fixtures/pages/images");
    if (existsSync(images)) cpSync(images, resolve(siteRoot, "src/content/pages/images"), copyOptions);
  }

  const postsDir = resolve(siteRoot, "src/content/posts");
  mkdirSync(resolve(postsDir, "images"), { recursive: true });
  for (const post of generateFixturePosts()) {
    writeFileSync(resolve(postsDir, `${post.slug}.mdx`), post.source);
    writeFileSync(resolve(postsDir, "images", post.image.name), post.image.data);
  }
  const postFixtures = resolve(repoRoot, "tests/fixtures/posts");
  cpSync(resolve(postFixtures, "images"), resolve(postsDir, "images"), copyOptions);
  for (const name of FIXTURE_POSTS) cpSync(resolve(postFixtures, "valid", name), resolve(postsDir, name));

  // Fixture projects (with their images) go into the projects collection.
  const projectFixtures = resolve(repoRoot, "tests/fixtures/projects");
  if (existsSync(projectFixtures)) {
    // broken/ holds the files that must fail the build (tests/build/project-validation.test.ts).
    cpSync(projectFixtures, resolve(siteRoot, "src/content/projects"), {
      ...copyOptions,
      filter: (source: string) => copyOptions.filter(source) && !source.includes("/broken"),
    });
  }

  await build({ root: siteRoot, logLevel: "warn" });
}

// Run only as a script (`node scripts/build-fixture-site.ts`), not when a test imports the generator.
if (import.meta.main) await buildSite();
