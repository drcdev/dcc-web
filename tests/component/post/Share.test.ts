// Share (FR-028; research R10): plain LinkedIn and email links always, a hidden
// Share button at the end of the same row, and the post's own title and address.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Share from "../../../src/components/post/Share.astro";
import { shareLinks } from "../../../src/lib/share.ts";
import { byName, tags, textOf } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
});

const props = { title: "Tom & Jerry", href: "/writing/one/" };
const render = () => container.renderToString(Share, { props });

describe("Share", () => {
  it("is a data-share section with the h2 'Share this post'", async () => {
    const html = await render();
    const [section] = tags(html).filter((t) => "data-share" in t.attrs);
    expect(section).toBeDefined();
    expect(byName(html, "h2")).toHaveLength(1);
    expect(textOf(html, "h2")).toBe("Share this post");
  });

  it("always has plain links 'Share on LinkedIn' and 'Share by email' with the title and full address", async () => {
    const html = await render();
    const links = byName(html, "a");
    const expected = shareLinks("Tom & Jerry", "https://example.test/writing/one/");
    expect(links.map((a) => a.attrs.href)).toEqual([expected.linkedin, expected.email]);
    expect(html).toMatch(/>\s*Share on LinkedIn\s*</);
    expect(html).toMatch(/>\s*Share by email\s*</);
    expect(links.every((a) => !("hidden" in a.attrs))).toBe(true);
  });

  it("has a hidden Share button after the links, in the same row, carrying the title and address", async () => {
    const html = await render();
    const buttons = byName(html, "button");
    expect(buttons).toHaveLength(1);
    const button = buttons[0]!;
    expect(button.attrs.type).toBe("button");
    expect("hidden" in button.attrs).toBe(true);
    expect(html).toMatch(/<button[^>]*>\s*(?:<[^>]+>\s*)*Share\s*<\/button>/);
    expect(button.index).toBeGreaterThan(byName(html, "a").at(-1)!.index);
    const [section] = tags(html).filter((t) => "data-share" in t.attrs);
    expect(section!.attrs["data-share-title"]).toBe("Tom & Jerry");
    expect(section!.attrs["data-share-url"]).toBe("https://example.test/writing/one/");
    // Same row: links and button are siblings, not a list (a hidden item would leave an empty one).
    expect(byName(html, "ul")).toHaveLength(0);
    expect(button.index).toBeGreaterThan(html.indexOf("<h2"));
  });
});
