// Direction C "Chapters" story (T053; FR-008, FR-010 to FR-015, FR-018).
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "../../sections/helpers.ts";
import { byName, tags } from "../../html.ts";
import ChapterStory from "../../../../src/prototypes/portfolio/c/ChapterStory.astro";
import { focusPocus } from "../../../../src/prototypes/portfolio/sample.ts";
import { STAGE_ORDER } from "../../../../src/prototypes/portfolio/types.ts";

const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

let html = "";
let text = "";
beforeAll(async () => {
  html = await render(ChapterStory, { story: focusPocus });
  text = plain(html);
});

describe("ChapterStory", () => {
  it("has seven stages in STAGE_ORDER, each with an id, an h2 and a draft mark", () => {
    const sections = byName(html, "section");
    expect(sections.map((s) => s.attrs.id)).toEqual([...STAGE_ORDER]);
    expect(byName(html, "h2")).toHaveLength(7);
    for (const s of sections) expect(html).toContain(`id="${s.attrs["aria-labelledby"]}"`);
    expect(tags(html).filter((t) => "data-draft-mark" in t.attrs)).toHaveLength(7);
  });

  it("has one h1, the prototype notice and the draft notice", () => {
    expect(byName(html, "h1")).toHaveLength(1);
    expect(text).toContain("Focus Pocus");
    expect(text).toContain(focusPocus.entry.problem);
    expect(tags(html).some((t) => "data-prototype-notice" in t.attrs)).toBe(true);
    expect(tags(html).some((t) => "data-draft-notice" in t.attrs)).toBe(true);
  });

  it("shows the same shared content as the sample data (FR-008)", () => {
    for (const stage of focusPocus.stages) {
      expect(text).toContain(stage.heading);
      for (const p of stage.body) expect(text).toContain(p);
      if (stage.visual) expect(text).toContain(stage.visual.label);
    }
    for (const o of focusPocus.options) {
      expect(text).toContain(o.name);
      expect(text).toContain(o.summary);
      for (const line of [...o.pros, ...o.cons]) expect(text).toContain(line);
      if (o.reason) expect(text).toContain(o.reason);
    }
  });

  it("renders the options as one comparison table inside a labelled, focusable region", () => {
    expect(byName(html, "option-tabs")).toHaveLength(0);
    expect(byName(html, "details")).toHaveLength(0);
    expect(html).not.toContain('role="tablist"');
    expect(byName(html, "table")).toHaveLength(1);
    const region = tags(html).find((t) => t.attrs.role === "region" && t.attrs.tabindex === "0")!;
    expect(region).toBeDefined();
    expect(region.name).toBe("div");
    expect(html).toContain(`id="${region.attrs["aria-labelledby"]}"`);
    expect(byName(html, "caption")).toHaveLength(1);
    const ths = byName(html, "th");
    const cols = ths.filter((t) => t.attrs.scope === "col");
    const rows = ths.filter((t) => t.attrs.scope === "row");
    for (const o of focusPocus.options) expect(plain(html)).toContain(o.name);
    expect(cols.length).toBeGreaterThanOrEqual(focusPocus.options.length);
    expect(rows.length).toBeGreaterThanOrEqual(focusPocus.constraints.length);
    for (const c of focusPocus.constraints) expect(text).toContain(c.label);
  });

  it("labels the chosen option column 'Chosen' in text with its reason nearby", () => {
    const chosen = focusPocus.options.filter((o) => o.chosen);
    expect(chosen).toHaveLength(1);
    const head = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"));
    expect(plain(head)).toContain("Chosen");
    expect(plain(head).match(/Chosen/g)).toHaveLength(1);
    expect(tags(html).filter((t) => "data-chosen" in t.attrs).length).toBeGreaterThan(0);
    expect(text).toContain(chosen[0]!.reason!);
  });

  it("states each fit as words, not colour alone", () => {
    const body = plain(html.slice(html.indexOf("<tbody"), html.indexOf("</tbody>")));
    for (const word of ["Meets", "Partly meets", "Does not meet"]) expect(body).toContain(word);
  });

  it("has a sticky visual panel in each chapter that has a visual", () => {
    expect(tags(html).filter((t) => "data-sticky-visual" in t.attrs)).toHaveLength(
      focusPocus.stages.filter((s) => s.visual).length,
    );
  });

  it("has a chapter progress rail", () => {
    const nav = byName(html, "nav").find((n) => n.attrs["aria-label"] === "Chapters")!;
    expect(nav).toBeDefined();
    expect(tags(html).some((t) => "data-progress" in t.attrs && t.attrs["aria-hidden"] === "true")).toBe(true);
  });

  it("names the story title for the cross-document view transition", () => {
    const h1 = tags(html).find((t) => t.name === "h1")!;
    expect("data-vt-title" in h1.attrs).toBe(true);
  });

  it("keeps visuals inside their own stage", () => {
    for (const stage of focusPocus.stages) {
      const start = html.indexOf(`<section id="${stage.id}"`);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = html.indexOf("</section>", start);
      const inside = html.slice(start, end);
      expect(inside.includes("data-stage-visual")).toBe(Boolean(stage.visual));
    }
  });

  it("links to the demo and repository and explains the stand-in in the built stage", () => {
    const start = html.indexOf('<section id="built"');
    const built = html.slice(start, html.indexOf("</section>", start));
    expect(built).toContain('href="https://drc.dev/projects/focus-pocus"');
    expect(built).toContain(`href="${focusPocus.demo.secondaryHref}"`);
    expect(plain(built)).toContain(focusPocus.demo.standInNote);
  });

  it("invites contact from the invitation stage", () => {
    const start = html.indexOf('<section id="invitation"');
    const inv = html.slice(start, html.indexOf("</section>", start));
    expect(plain(inv)).toContain("Have a problem like this?");
    expect(inv).toContain('href="/contact/?project=focus-pocus"');
  });

  it("marks stages for scroll reveal and uses no inline style", () => {
    expect(tags(html).filter((t) => "data-reveal" in t.attrs).length).toBeGreaterThan(0);
    expect(tags(html).some((t) => "style" in t.attrs)).toBe(false);
  });
});
