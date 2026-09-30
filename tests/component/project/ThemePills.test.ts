import { describe, expect, it } from "vitest";
import ThemePills from "../../../src/components/project/ThemePills.astro";
import { byName } from "../html.ts";
import { render } from "../sections/helpers.ts";

describe("ThemePills", () => {
  it("renders a labelled list with one item per theme", async () => {
    const html = await render(ThemePills, { themes: ["AI integration", "macOS"] });
    const [ul] = byName(html, "ul");
    expect(ul!.attrs["aria-label"]).toBe("Themes");
    expect(byName(html, "li")).toHaveLength(2);
    expect(html).toContain("AI integration");
    expect(html).toContain("macOS");
  });

  it("uses the shared pill", async () => {
    const html = await render(ThemePills, { themes: ["macOS"] });
    expect(html).toContain("data-pill");
  });
});
