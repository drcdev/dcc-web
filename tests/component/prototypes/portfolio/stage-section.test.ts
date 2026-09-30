import { describe, expect, it } from "vitest";
import { render } from "../../sections/helpers.ts";
import { byName, tags } from "../../html.ts";
import StageSection from "../../../../src/prototypes/portfolio/shared/StageSection.astro";
import { focusPocus } from "../../../../src/prototypes/portfolio/sample.ts";

const stage = (id: string) => focusPocus.stages.find((s) => s.id === id)!;

describe("StageSection", () => {
  it("renders a labelled section with an h2 and a draft mark", async () => {
    const html = await render(StageSection, { stage: stage("built") });
    const section = byName(html, "section")[0]!;
    expect(section.attrs.id).toBe("built");
    const labelledby = section.attrs["aria-labelledby"]!;
    const h2 = byName(html, "h2");
    expect(h2).toHaveLength(1);
    expect(h2[0]!.attrs.id).toBe(labelledby);
    expect(html).toContain(stage("built").heading);
    expect(tags(html).some((t) => "data-draft-mark" in t.attrs)).toBe(true);
  });

  it("renders every body paragraph", async () => {
    const html = await render(StageSection, { stage: stage("problem") });
    for (const p of stage("problem").body) expect(html).toContain(p.replace(/'/g, "&#39;"));
  });

  it("puts the visual inside the same section", async () => {
    const html = await render(StageSection, { stage: stage("built") });
    const start = html.indexOf("<section");
    const end = html.indexOf("</section>");
    const inside = html.slice(start, end);
    expect(inside).toContain('role="img"');
    expect(inside).toContain("data-stage-visual");
  });

  it("leaves no empty visual column when a stage has no visual", async () => {
    const html = await render(StageSection, { stage: stage("lessons") });
    expect(tags(html).some((t) => "data-stage-visual" in t.attrs)).toBe(false);
    expect(html).not.toContain("md:grid-cols-2");
  });

  it("renders slot content after the body", async () => {
    const html = await render(StageSection, { stage: stage("invitation") }, '<a href="/x/">Slot link</a>');
    expect(html).toContain("Slot link");
  });
});
