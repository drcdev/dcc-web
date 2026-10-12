// AuthorCard (specs/039-post-author-card/contracts/author-card.md rows A4 to A6, A9, A14): the card
// at the end of every post. Its wording comes from blog.author and is never repeated here (FR-003).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import AuthorCard from "../../../src/components/post/AuthorCard.astro";
import { blog } from "../../../src/config/blog.ts";
import { byName, tags, textOf } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (topics: readonly string[] = ["agentic-ai"]) =>
  container.renderToString(AuthorCard, { props: { topics } });

const decode = (text: string) => text.replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const paragraphs = (html: string) =>
  [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => decode(m[1]!.replace(/<[^>]+>/g, "").trim()));

describe("AuthorCard markup", () => {
  it("A1/A9: is one section[data-author-card] with no script, button, hidden element or landmark attributes", async () => {
    const html = await render();
    const sections = byName(html, "section");
    expect(sections).toHaveLength(1);
    const [section] = sections;
    expect("data-author-card" in section!.attrs).toBe(true);
    for (const attr of ["aria-label", "aria-labelledby", "role"]) expect(section!.attrs[attr]).toBeUndefined();
    expect(byName(html, "script")).toHaveLength(0);
    expect(byName(html, "button")).toHaveLength(0);
    expect(tags(html).filter((t) => "hidden" in t.attrs)).toHaveLength(0);
  });

  it("A4: has one h2 'Written by {name}' with no link inside", async () => {
    const html = await render();
    expect(byName(html, "h2")).toHaveLength(1);
    expect(decode(textOf(html, "h2")!)).toBe(`Written by ${blog.author.name}`);
    expect(/<h2\b[^>]*>[\s\S]*?<a\b[\s\S]*?<\/h2>/.test(html)).toBe(false);
  });

  it("A5: has one photo with the configured alt, 96 x 96, 1x and 2x WebP and lazy loading", async () => {
    const [img, ...rest] = byName(await render(), "img");
    expect(rest).toHaveLength(0);
    expect(img!.attrs.alt).toBe(blog.author.photoAlt);
    expect(img!.attrs.width).toBe("96");
    expect(img!.attrs.height).toBe("96");
    expect(img!.attrs.loading).toBe("lazy");
    const srcset = img!.attrs.srcset ?? "";
    expect(srcset).toMatch(/(?:\.webp|f=webp)[^,]*\s1x/);
    expect(srcset).toMatch(/(?:\.webp|f=webp)[^,]*\s2x/);
  });

  it("A6: has the two configured lines, in order", async () => {
    expect(paragraphs(await render())).toEqual([...blog.author.lines]);
  });

  it("A14: reads heading, lines, then the photo last, with no date, topic pill, title or summary", async () => {
    const html = await render();
    const h2 = html.indexOf("<h2");
    const first = html.indexOf("<p");
    const last = html.lastIndexOf("<p");
    const img = html.indexOf("<img");
    expect(h2).toBeLessThan(first);
    expect(last).toBeLessThan(img);
    expect(html.lastIndexOf("</p>")).toBeLessThan(img);
    expect(byName(html, "time")).toHaveLength(0);
    expect(html).not.toContain("data-topic-pill");
  });
});

const links = (html: string) =>
  [...html.matchAll(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: m[1],
    text: decode(m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()),
  }));

describe("AuthorCard links", () => {
  it.each([
    ["drift", "More in Drift", "/writing/drift/"],
    ["convergence", "More in Convergence", "/writing/convergence/"],
  ])("A8: a %s post gets the series link first", async (id, text, href) => {
    const [first, ...rest] = links(await render(["agentic-ai", id]));
    expect(first).toEqual({ href, text });
    expect(rest.map((l) => l.text)).not.toContain("More of my writing");
  });

  it("A8: a post in no series gets 'More of my writing' to /writing/, and no series link", async () => {
    const found = links(await render(["agentic-ai", "healthcare-leadership"]));
    expect(found[0]).toEqual({ href: "/writing/", text: "More of my writing" });
    expect(found.some((l) => l.text.startsWith("More in "))).toBe(false);
  });

  it("A7: the list has three links in order, none with aria-label, all texts different", async () => {
    for (const topics of [["drift"], ["agentic-ai"]]) {
      const html = await render(topics);
      expect(byName(html, "ul")).toHaveLength(1);
      const found = links(html);
      expect(found).toHaveLength(3);
      expect(found.slice(1)).toEqual([
        { href: "/about/", text: "More about me" },
        { href: "/contact/", text: "Get in touch" },
      ]);
      expect(byName(html, "a").filter((a) => "aria-label" in a.attrs)).toHaveLength(0);
    }
    const texts = ["More in Drift", "More in Convergence", "More of my writing", "More about me", "Get in touch"];
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("A4: the heading and name are not links", async () => {
    const html = await render();
    expect(/<h2\b[\s\S]*?<\/h2>/.exec(html)![0]).not.toContain("<a");
  });
});
