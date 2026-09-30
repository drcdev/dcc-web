// TopicPill: one link to a topic page, in the topic's colour
// (contracts/blog-pages.md "Post card"; FR-011, FR-017).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import TopicPill from "../../../src/components/post/TopicPill.astro";
import { topicStyles } from "../../../src/components/post/topic-styles.ts";
import { topics } from "../../../src/config/topics.ts";
import { byName, classList } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("TopicPill", () => {
  it.each(topics.map((t) => [t.id, t.name, t.colour] as const))(
    "links %s to its topic page with its name, in its colour",
    async (id, name, colour) => {
      const html = await container.renderToString(TopicPill, { props: { topic: id } });
      const links = byName(html, "a");
      expect(links).toHaveLength(1);
      expect(links[0]!.attrs.href).toBe(`/writing/topics/${id}/`);
      expect("data-topic-pill" in links[0]!.attrs).toBe(true);
      expect(html.replace(/<[^>]+>/g, "").trim()).toBe(name.replace("&", "&amp;"));
      for (const cls of topicStyles[colour]!.pill.split(/\s+/)) {
        expect(classList(links[0]!)).toContain(cls);
      }
    },
  );
});
