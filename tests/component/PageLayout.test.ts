// Component tests for src/layouts/PageLayout.astro via Astro's Container API
// (contracts/page-dom.md "Standard page"; FR-013, FR-014, FR-015; US4 scenario 6).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PageLayout from "../../src/layouts/PageLayout.astro";
import sample from "../fixtures/pages/images/sample.png";
import { byName, classList, tags } from "./html.ts";

let container: AstroContainer;

async function render(props: Record<string, unknown>, body = "<p>Body text.</p><h2>Section</h2>") {
  return container.renderToString(PageLayout, {
    partial: false,
    props: {
      title: "Workshops",
      description: "About workshops.",
      navigation: [{ label: "Services", href: "/services/", kind: "primary" }],
      ...props,
    },
    request: new Request("https://example.test/workshops/"),
    slots: { default: body },
  });
}

beforeAll(async () => {
  container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
});

describe("PageLayout title and body", () => {
  let html = "";
  beforeAll(async () => {
    html = await render({});
  });

  it("renders exactly one <h1> with the title", () => {
    const h1s = byName(html, "h1");
    expect(h1s).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*Workshops\s*<\/h1>/);
  });

  it("renders inside <main> as an <article> with the content section", () => {
    expect(byName(html, "article")).toHaveLength(1);
    const section = tags(html).find((t) => t.attrs.id === "content-section");
    expect(section).toBeDefined();
    const classes = classList(section!);
    for (const c of ["prose", "lg:prose-lg", "dark:prose-invert", "prose-accent", "max-w-screen-lg"]) {
      expect(classes).toContain(c);
    }
  });

  it("puts the slot content inside the content section", () => {
    const start = html.indexOf('id="content-section"');
    expect(html.indexOf("Body text.", start)).toBeGreaterThan(start);
  });

  it("adds no share bar", () => {
    expect(html.toLowerCase()).not.toContain("share");
  });

  it("uses the title for the document title and the description for metadata", () => {
    expect(html).toContain("<title>Workshops · Don Coleman</title>");
    expect(html).toContain('content="About workshops."');
  });
});

describe("PageLayout feature image", () => {
  it("renders a figure with alt text and caption when set", async () => {
    const html = await render({ featureImage: { src: sample, alt: "A stage", caption: "From 2025" } });
    const figures = byName(html, "figure");
    expect(figures).toHaveLength(1);
    const img = byName(html, "img");
    expect(img).toHaveLength(1);
    expect(img[0]!.attrs.alt).toBe("A stage");
    expect(html).toMatch(/<figcaption[^>]*>\s*From 2025\s*<\/figcaption>/);
  });

  it("renders no figure and no empty wrapper when absent", async () => {
    const html = await render({});
    expect(byName(html, "figure")).toHaveLength(0);
    expect(byName(html, "img")).toHaveLength(0);
    // Only the title section and the content section sit in the article.
    const sections = byName(html, "section");
    expect(sections).toHaveLength(2);
  });
});

describe("PageLayout draft notice", () => {
  it("shows the notice inside the content section when draft is true", async () => {
    const html = await render({ draft: true });
    const notice = tags(html).filter((t) => "data-draft-notice" in t.attrs);
    expect(notice).toHaveLength(1);
    expect(html.indexOf("data-draft-notice")).toBeGreaterThan(html.indexOf('id="content-section"'));
  });

  it("omits the notice otherwise", async () => {
    expect(await render({})).not.toContain("data-draft-notice");
    expect(await render({ draft: false })).not.toContain("data-draft-notice");
  });
});

describe("PageLayout navigation", () => {
  it("passes navigation to the header", async () => {
    const html = await render({ navigation: [{ label: "Only", href: "/only/", kind: "primary" }] });
    const list = /<ul[^>]+id="primary-nav-list"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? "";
    expect(list).toContain("Only");
    expect(list).not.toContain("Services");
  });
});
