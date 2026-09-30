// PostLayout (contracts/blog-pages.md "Post"; FR-019 to FR-030, FR-047): hero,
// then the title card, then the article body, the views note and the head
// metadata. DOM order is hero first even though the card overlaps it visually.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PostLayout from "../../../src/layouts/PostLayout.astro";
import { blog } from "../../../src/config/blog.ts";
import { byName, classList, meta, tags } from "../html.ts";
import { summary, withImage } from "./fixtures.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
});

const render = (post: ReturnType<typeof summary>, extra: Record<string, unknown> = {}) =>
  container.renderToString(PostLayout, {
    partial: false,
    props: { post, navigation: [{ label: "Writing", href: "/writing/", kind: "primary" }], ...extra },
    request: new Request(`https://example.test${post.href}`),
    slots: { default: "<p>Body text.</p><h2>Section</h2>" },
  });

describe("PostLayout structure", () => {
  it("has one h1 with the title, one article and the eyebrow with the blog's name", async () => {
    const html = await render(summary("one"));
    expect(byName(html, "h1")).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*Title of one\s*<\/h1>/);
    expect(byName(html, "article")).toHaveLength(1);
    const eyebrow = html.indexOf(blog.sectionName.replace("&", "&amp;"), html.indexOf("<article"));
    expect(eyebrow).toBeGreaterThan(html.indexOf("<article"));
    expect(eyebrow).toBeLessThan(html.indexOf("<h1"));
  });

  it("shows the summary and the Featured mark for a featured post only", async () => {
    const featured = await render(summary("one", { featured: true }));
    expect(featured).toContain("Summary of one.");
    expect(byName(featured, "span").filter((s) => "data-featured-mark" in s.attrs)).toHaveLength(1);
    const plain = await render(summary("one"));
    expect(plain).not.toContain("data-featured-mark");
  });

  it("puts the hero before the title card in the DOM when there is a feature image", async () => {
    const html = await render(withImage("pic"));
    const imgs = byName(html, "img");
    expect(imgs[0]!.attrs.alt).toBe("Picture for pic");
    expect(imgs[0]!.attrs.fetchpriority).toBe("high");
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf("<h1"));
  });

  it("has no image and no empty hero box without a feature image", async () => {
    const html = await render(summary("plain"));
    expect(byName(html, "img")).toHaveLength(0);
    expect(html).not.toContain("data-post-hero");
  });

  it("renders the meta (dates, reading time, topics) inside the title card, before the body", async () => {
    const html = await render(summary("one", { updated: new Date("2026-09-15") }));
    expect(html.indexOf("<time")).toBeGreaterThan(html.indexOf("<h1"));
    expect(html.indexOf("Body text.")).toBeGreaterThan(html.lastIndexOf("data-topic-pill"));
  });

  it("puts the body in the prose column and the views note after it", async () => {
    const html = await render(summary("one"));
    const body = tags(html).find((t) => "data-post-body" in t.attrs);
    expect(body).toBeDefined();
    for (const c of ["prose", "dark:prose-invert", "prose-accent"]) expect(classList(body!)).toContain(c);
    expect(html.indexOf("data-views-note")).toBeGreaterThan(html.indexOf("Body text."));
    expect(html).toContain(blog.viewsNote);
  });
});

describe("PostLayout draft (FR-032, FR-045)", () => {
  it("starts the title card with a Draft notice, before the eyebrow and the title", async () => {
    const html = await render(summary("d", { draft: true }));
    const notices = byName(html, "p").filter((p) => "data-draft-notice" in p.attrs);
    expect(notices).toHaveLength(1);
    expect(html).toMatch(
      /data-draft-notice[^>]*>\s*<strong[^>]*>Draft\.<\/strong>\s*This post is a draft and is not on the live site\./,
    );
    const card = html.indexOf("data-title-card");
    expect(html.indexOf("data-draft-notice")).toBeGreaterThan(card);
    expect(html.indexOf("data-draft-notice")).toBeLessThan(html.indexOf(blog.sectionName.replace("&", "&amp;"), card));
    expect(html.indexOf("data-draft-notice")).toBeLessThan(html.indexOf("<h1"));
  });

  it("has no Draft notice for a published post", async () => {
    expect(await render(summary("p"))).not.toContain("data-draft-notice");
  });

  it("asks search engines not to index a draft", async () => {
    const draft = await render(summary("d", { draft: true }));
    expect(meta(draft, "name", "robots")).toHaveLength(1);
    expect(meta(draft, "name", "robots")[0]!.attrs.content).toBe("noindex");
  });
});

describe("PostLayout head", () => {
  it("is an article with published and modified times", async () => {
    const html = await render(summary("one", { date: new Date("2026-08-27"), updated: new Date("2026-09-15") }));
    expect(meta(html, "property", "og:type")[0]!.attrs.content).toBe("article");
    expect(meta(html, "property", "article:published_time")[0]!.attrs.content).toBe("2026-08-27");
    expect(meta(html, "property", "article:modified_time")[0]!.attrs.content).toBe("2026-09-15");
  });

  it("has no modified time for a post that was never updated", async () => {
    expect(meta(await render(summary("one")), "property", "article:modified_time")).toHaveLength(0);
  });

  it("uses the post title with the site suffix, the summary as the description, and its own canonical address", async () => {
    const html = await render(summary("one"));
    expect(html).toContain("<title>Title of one · Don Coleman</title>");
    expect(meta(html, "name", "description")[0]!.attrs.content).toBe("Summary of one.");
    expect(byName(html, "link").find((l) => l.attrs.rel === "canonical")!.attrs.href).toBe(
      "https://example.test/writing/one/",
    );
  });

  it("uses the feature image for og:image with its alt text when a sharing image is passed", async () => {
    const html = await render(withImage("pic"), { image: "/_astro/pic.png" });
    expect(meta(html, "property", "og:image")[0]!.attrs.content).toBe("https://example.test/_astro/pic.png");
    expect(meta(html, "property", "og:image:alt")[0]!.attrs.content).toBe("Picture for pic");
  });

  it("advertises the feed through the head slot", async () => {
    const html = await render(summary("one"));
    const feed = byName(html, "link").find((l) => l.attrs.type === "application/rss+xml");
    expect(feed!.attrs.rel).toBe("alternate");
    expect(feed!.attrs.title).toBe(blog.feedTitle);
    expect(feed!.attrs.href).toBe("https://example.test/writing/rss.xml");
  });
});
