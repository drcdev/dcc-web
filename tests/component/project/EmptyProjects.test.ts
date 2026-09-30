import { describe, expect, it } from "vitest";
import EmptyProjects from "../../../src/components/project/EmptyProjects.astro";
import { byName, textOf } from "../html.ts";
import { render } from "../sections/helpers.ts";

describe("EmptyProjects", () => {
  it("says no projects are published yet", async () => {
    const html = await render(EmptyProjects);
    expect(byName(html, "p").some((t) => "data-projects-empty" in t.attrs)).toBe(true);
    expect(textOf(html, "p")).toBe("No projects are published yet.");
  });
});
