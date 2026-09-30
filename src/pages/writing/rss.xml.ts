// The blog feed, `/writing/rss.xml` (spec 008 US6; contracts/feed.md; FR-036, FR-037).
// Built with the official `@astrojs/rss` integration (docs.astro.build/en/recipes/rss/).
// `getPosts()` applies the build-mode rule, and the feed then drops drafts again, so a draft
// never appears on any build, preview included. `context.site` is the build's own origin
// (astro.config.mjs, resolveSiteOrigin), so a preview feed points at the preview.
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { feedOptions } from "../../lib/feed.ts";
import { getPosts } from "../../lib/posts.ts";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("The feed needs Astro's `site` (astro.config.mjs).");
  const posts = await getPosts();
  return rss(
    feedOptions(
      posts.map(({ id, data }) => ({
        slug: id,
        title: data.title,
        summary: data.summary,
        date: data.date,
        updated: data.updated,
        draft: data.draft,
      })),
      site,
    ),
  );
};
