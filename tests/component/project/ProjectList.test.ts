import { describe, expect, it } from "vitest";
import ProjectList from "../../../src/components/project/ProjectList.astro";
import { byName } from "../html.ts";
import { render } from "../sections/helpers.ts";

const themes = [{ key: "tooling", label: "Tooling" }];
const rowsOf = (count: number) =>
  Array.from({ length: count }, (_, i) => `<li data-project="p${i}">P${i}</li>`).join("");

describe("ProjectList", () => {
  it("renders a plain list at the default threshold of 10 projects", async () => {
    const html = await render(ProjectList, { themes, total: 10 }, rowsOf(10));
    expect(byName(html, "project-filter")).toHaveLength(0);
    expect(html).not.toContain("data-filter-");
    const lists = byName(html, "ul").filter((t) => "data-project-list" in t.attrs);
    expect(lists).toHaveLength(1);
    expect(byName(html, "li").filter((t) => "data-project" in t.attrs)).toHaveLength(10);
  });

  it("renders the filter at 11 projects", async () => {
    const html = await render(ProjectList, { themes, total: 11 }, rowsOf(11));
    expect(byName(html, "project-filter")).toHaveLength(1);
    expect(html).toContain("data-filter-controls");
    expect(byName(html, "li").filter((t) => "data-project" in t.attrs)).toHaveLength(11);
  });
});
