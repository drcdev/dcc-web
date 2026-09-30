import { describe, expect, it } from "vitest";
import TitleTransition from "../../../src/components/project/TitleTransition.astro";
import { transitionCss } from "../../../src/lib/content/title-transition.ts";
import { byName } from "../html.ts";
import { render } from "../sections/helpers.ts";

describe("TitleTransition", () => {
  it("renders one small style with a name rule per slug, and no style attribute", async () => {
    const html = await render(TitleTransition, { slugs: ["focus-pocus", "second-one"] });
    expect(byName(html, "style")).toHaveLength(1);
    expect(html).toContain('[data-title-slug="focus-pocus"]');
    expect(html).toContain("view-transition-name: project-focus-pocus");
    expect(html).toContain("view-transition-name: project-second-one");
    expect(html).toContain("prefers-reduced-motion: no-preference");
    expect(html).not.toMatch(/\sstyle="/);
  });

  it("renders exactly the text the CSP hash is computed from", async () => {
    const html = await render(TitleTransition, { slugs: ["focus-pocus"] });
    expect(html).toContain(transitionCss(["focus-pocus"]));
  });

  it("refuses a slug that could break out of the rule", () => {
    expect(() => transitionCss(['x"] { color: red } a['])).toThrow(/slug/i);
  });
});
