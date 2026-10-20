// ViewsNote (FR-027): one plain paragraph, its text from src/config/blog.ts.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import ViewsNote from "../../../src/components/post/ViewsNote.astro";
import { blog } from "../../../src/config/blog.ts";
import { byName, classList, tags, textOf } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("ViewsNote", () => {
  it("is a plain <p data-views-note> with the configured text and no role", async () => {
    const html = await container.renderToString(ViewsNote);
    const [p] = tags(html).filter((t) => "data-views-note" in t.attrs);
    expect(p!.name).toBe("p");
    expect(p!.attrs.role).toBeUndefined();
    expect("hidden" in p!.attrs).toBe(false);
    expect(textOf(html, "p")).toBe(blog.viewsNote);
    expect(byName(html, "p")).toHaveLength(1);
  });

  it("F9: is a small italic grey caption with no border or padding (FR-003)", async () => {
    const html = await container.renderToString(ViewsNote);
    const p = tags(html).find((t) => "data-views-note" in t.attrs)!;
    const classes = classList(p);
    for (const c of ["text-sm", "italic", "text-dusk-600", "dark:text-dusk-300"]) expect(classes, c).toContain(c);
    expect(classes.filter((c) => /^(border|p[trblxy]?-|dark:border)/.test(c))).toEqual([]);
  });
});
