import { describe, expect, it } from "vitest";
import OptionsTable from "../../../src/components/project/OptionsTable.astro";
import { byName } from "../html.ts";
import { render } from "../sections/helpers.ts";
import { makeProject, renderWithProject } from "./helpers.ts";

const table = (project = makeProject()) => renderWithProject(OptionsTable, {}, undefined, project);

describe("OptionsTable", () => {
  it("is one data table with a caption naming the project", async () => {
    const html = await table();
    expect(byName(html, "table")).toHaveLength(1);
    const [caption] = byName(html, "caption");
    expect(caption!.attrs.id).toBe("options-caption");
    expect(html).toContain("How the options compare for Focus Pocus");
  });

  it("wraps the table in a keyboard-reachable named region", async () => {
    const region = byName(await table(), "div").find((d) => d.attrs.role === "region");
    expect(region).toBeDefined();
    expect(region!.attrs.tabindex).toBe("0");
    expect(region!.attrs["aria-labelledby"]).toBe("options-caption");
    expect(region!.attrs["data-options-table"]).toBeDefined();
  });

  it("has a column header for the option column and each constraint, and a row header per option", async () => {
    const html = await table();
    const cols = byName(html, "th").filter((t) => t.attrs.scope === "col");
    expect(cols).toHaveLength(3);
    expect(html).toContain("Option");
    expect(html).toContain("Works on macOS");
    expect(html).toContain("Natural-language dates");
    const rows = byName(html, "th").filter((t) => t.attrs.scope === "row");
    expect(rows).toHaveLength(2);
    expect(html).toContain("URL scheme");
    expect(html).toContain("JXA");
  });

  it("uses the writer's first header text for the option column", async () => {
    const project = makeProject();
    project.comparison.optionHeader = "Route";
    expect(await table(project)).toContain("Route");
  });

  it("gives every answer cell a data-fit value and the answer in words, with a hidden decorative mark", async () => {
    const html = await table();
    const cells = byName(html, "td");
    expect(cells.map((c) => c.attrs["data-fit"])).toEqual(["yes", "no", "yes", "partly"]);
    expect(html).toMatch(/>\s*Yes\s*</);
    expect(html).toMatch(/>\s*Partly\s*</);
    expect(html).toMatch(/>\s*No\s*</);
    expect(byName(html, "span").filter((s) => s.attrs["aria-hidden"] === "true").length).toBeGreaterThanOrEqual(4);
  });

  it("marks the chosen row in text and with data-chosen, and no other row", async () => {
    const html = await table();
    const chosenRows = byName(html, "tr").filter((r) => "data-chosen" in r.attrs);
    expect(chosenRows).toHaveLength(1);
    const labels = byName(html, "span").filter((s) => "data-chosen-label" in s.attrs);
    expect(labels).toHaveLength(1);
    expect(html).toContain("Chosen");
    // The marker sits in the chosen option's row header, after its name.
    expect(html.indexOf("URL scheme")).toBeLessThan(html.indexOf("JXA"));
    expect(html.indexOf("JXA")).toBeLessThan(html.indexOf("data-chosen-label"));
  });

  it("uses no script", async () => {
    expect(byName(await table(), "script")).toHaveLength(0);
  });

  it("throws when the route has not provided a project", async () => {
    await expect(render(OptionsTable)).rejects.toThrow(/project/i);
  });
});
