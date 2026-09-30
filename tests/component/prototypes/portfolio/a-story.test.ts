// Direction A "Timeline" story (T025; FR-008, FR-010 to FR-015, FR-018).
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "../../sections/helpers.ts";
import { byName, tags } from "../../html.ts";
import TimelineStory from "../../../../src/prototypes/portfolio/a/TimelineStory.astro";
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
  html = await render(TimelineStory, { story: focusPocus });
  text = plain(html);
});

describe("TimelineStory", () => {
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

  it("renders every option as a <details> with the chosen one open and labelled", () => {
    const options = tags(html).filter((t) => "data-option" in t.attrs);
    expect(options.map((o) => o.attrs["data-option"])).toEqual(focusPocus.options.map((o) => o.id));
    for (const o of options) {
      expect(o.name).toBe("details");
      const chosen = "data-chosen" in o.attrs;
      expect(chosen).toBe(focusPocus.options.find((x) => x.id === o.attrs["data-option"])!.chosen);
      expect("open" in o.attrs).toBe(chosen);
      expect("hidden" in o.attrs).toBe(false);
    }
    expect(tags(html).filter((t) => "data-chosen" in t.attrs)).toHaveLength(1);
    expect(text).toContain("Chosen");
    expect(byName(html, "summary")).toHaveLength(focusPocus.options.length);
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
