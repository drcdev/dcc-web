// `getPostSummaries()` in a real build (tasks T017, T020; research R3, R6): the
// reading-time plugin reaches posts through `remarkPluginFrontmatter`, and the
// draft rule follows WORKERS_CI and WORKERS_CI_BRANCH. A throwaway route written
// into the copied site prints what the function returns.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const results: FixtureSiteResult[] = [];
afterEach(() => {
  for (const result of results.splice(0)) result.cleanup();
});

const route = `import { getPostSummaries } from "../lib/posts.ts";
export async function GET() {
  const posts = await getPostSummaries();
  return new Response(JSON.stringify(posts.map((p) => ({ slug: p.slug, draft: p.draft, minutesRead: p.minutesRead, href: p.href }))));
}
`;

async function summaries(env?: Record<string, string>) {
  const result = await buildFixtureSite([], {
    posts: ["valid/published.mdx", "valid/draft.mdx"],
    overrides: { "src/pages/summaries.json.ts": route },
    ...(env ? { env } : {}),
  });
  results.push(result);
  expect(result.message).toBe("");
  return JSON.parse(result.read("summaries.json")) as { slug: string; draft: boolean; minutesRead: number; href: string }[];
}

describe("getPostSummaries", () => {
  it("includes drafts and reading time in a build that is not production", async () => {
    const posts = await summaries();
    const slugs = posts.map((p) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(["published", "draft", "sample-everything", "sample-short"]));
    expect(posts.find((p) => p.slug === "draft")?.draft).toBe(true);
    expect(posts.find((p) => p.slug === "published")?.href).toBe("/writing/published/");
    for (const post of posts) expect(Number.isInteger(post.minutesRead) && post.minutesRead >= 1).toBe(true);
    expect(posts.find((p) => p.slug === "sample-short")?.minutesRead).toBe(1);
    expect(posts.find((p) => p.slug === "sample-everything")?.minutesRead).toBeGreaterThanOrEqual(1);
  });

  it("sorts newest first", async () => {
    const posts = await summaries();
    expect(posts.map((p) => p.slug).indexOf("published")).toBeLessThan(posts.map((p) => p.slug).indexOf("sample-short"));
  });

  it("leaves drafts out of a Workers Builds build of main (production)", async () => {
    const posts = await summaries({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" });
    expect(posts.map((p) => p.slug)).toEqual(["published"]);
  });

  it("includes drafts in a Workers Builds build of another branch (preview)", async () => {
    const posts = await summaries({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "008-blog" });
    expect(posts.some((p) => p.draft)).toBe(true);
  });

  it("fails safe: leaves drafts out when Workers Builds gives no branch", async () => {
    const posts = await summaries({ WORKERS_CI: "1" });
    expect(posts.some((p) => p.draft)).toBe(false);
  });
});
