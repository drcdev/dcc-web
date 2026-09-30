// The feed's item mapping and channel (data-model.md "Feed item"; contracts/feed.md;
// FR-036, SC-008). Pure mapping is tested directly; escaping and the guid are checked
// on the XML that `@astrojs/rss` renders from the mapped options.
import rss from "@astrojs/rss";
import { describe, expect, it } from "vitest";
import { feedOptions } from "../../../src/lib/feed.ts";

const site = "https://example.test";
const post = (over: Partial<Parameters<typeof feedOptions>[0][number]> = {}) => ({
  slug: "one",
  title: "One",
  summary: "The first post.",
  date: new Date("2026-06-01T00:00:00Z"),
  draft: false,
  ...over,
});

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([^<]*)</${name}>`))?.[1];

const render = async (posts: Parameters<typeof feedOptions>[0]) => {
  const response = await rss(feedOptions(posts, site));
  return response.text();
};

describe("feedOptions", () => {
  it("maps title, absolute link, description and pubDate", () => {
    const { items } = feedOptions([post()], site);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "One",
      link: "https://example.test/writing/one/",
      description: "The first post.",
      pubDate: new Date("2026-06-01T00:00:00Z"),
    });
  });

  it("adds dcterms:modified only when the post was updated", () => {
    const { items } = feedOptions([post({ updated: new Date("2026-06-10T00:00:00Z") }), post({ slug: "two" })], site);
    expect(items[0]!.customData).toBe("<dcterms:modified>2026-06-10T00:00:00.000Z</dcterms:modified>");
    expect(items[1]!.customData).toBeUndefined();
  });

  it("never maps a draft", () => {
    const { items } = feedOptions([post(), post({ slug: "d", draft: true })], site);
    expect(items.map((i) => i.link)).toEqual(["https://example.test/writing/one/"]);
  });

  it("keeps the order it is given (getPosts sorts newest first)", () => {
    const { items } = feedOptions([post({ slug: "b" }), post({ slug: "a" })], site);
    expect(items.map((i) => i.link)).toEqual(["https://example.test/writing/b/", "https://example.test/writing/a/"]);
  });
});

describe("the rendered feed", () => {
  it("is RSS 2.0 with the channel title, language and the dcterms namespace", async () => {
    const xml = await render([post()]);
    expect(xml).toMatch(/<rss [^>]*version="2\.0"/);
    expect(xml).toContain('xmlns:dcterms="http://purl.org/dc/terms/"');
    expect(tag(xml, "title")).toBe("Drift &amp; Convergence");
    expect(tag(xml, "language")).toBe("en-ca");
    expect(tag(xml, "link")).toBe("https://example.test/");
  });

  it("uses the absolute link as a permalink guid", async () => {
    const xml = await render([post()]);
    expect(xml).toContain('<guid isPermaLink="true">https://example.test/writing/one/</guid>');
    expect(tag(xml, "pubDate")).toBe("Mon, 01 Jun 2026 00:00:00 GMT");
    expect(xml).not.toContain("<dcterms:modified>");
  });

  it("writes dcterms:modified for an updated post", async () => {
    const xml = await render([post({ updated: new Date("2026-06-10T00:00:00Z") })]);
    expect(xml).toContain("<dcterms:modified>2026-06-10T00:00:00.000Z</dcterms:modified>");
  });

  it("escapes & and < in a title", async () => {
    const xml = await render([post({ title: "Fish & <chips>" })]);
    expect(xml).toContain("Fish &amp; &lt;chips&gt;");
    expect(xml).not.toContain("<chips>");
  });

  it("is a valid channel with no items when nothing is published", async () => {
    const xml = await render([post({ draft: true })]);
    expect(xml).not.toContain("<item>");
    expect(tag(xml, "title")).toBe("Drift &amp; Convergence");
    expect(xml).toContain("</channel></rss>");
  });
});
