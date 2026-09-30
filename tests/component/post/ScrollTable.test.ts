// ScrollTable replaces the Markdown `table` (contracts/blog-pages.md "Table";
// research R9; FR-026): a focusable, labelled region that scrolls sideways, with
// the table's own semantics inside.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import ScrollTable from "../../../src/components/post/ScrollTable.astro";
import { byName, classList } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("ScrollTable", () => {
  it("wraps the table in a labelled, focusable region", async () => {
    const html = await container.renderToString(ScrollTable, {
      slots: { default: "<thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody>" },
    });
    const [region] = byName(html, "div");
    expect(classList(region!)).toContain("table-wrapper");
    expect(region!.attrs.role).toBe("region");
    expect(region!.attrs["aria-label"]).toBe("Table");
    expect(region!.attrs.tabindex).toBe("0");
    expect(html.indexOf("<table")).toBeGreaterThan(html.indexOf("<div"));
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>1</td>");
    expect(html.indexOf("</table>")).toBeLessThan(html.indexOf("</div>"));
  });

  it("runs no script", async () => {
    const html = await container.renderToString(ScrollTable, { slots: { default: "<tbody></tbody>" } });
    expect(byName(html, "script")).toHaveLength(0);
  });
});
