import { describe, expect, it } from "vitest";
import OptionComparison from "../../../src/components/project/blocks/OptionComparison.astro";
import { byName } from "../html.ts";
import { makeProject, renderWithProject } from "./helpers.ts";

const comparison = {
  caption: "Ways to reach OmniFocus",
  constraints: [
    { id: "macos-only", label: "Works on macOS", detail: "Runs on the Mac." },
    { id: "dates", label: "Natural-language dates" },
  ],
  options: [
    {
      id: "url-scheme",
      name: "URL scheme",
      summary: "Open links.",
      fit: { "macos-only": "meets", dates: "misses" },
      cons: ["Cannot read tasks back."],
    },
    {
      id: "jxa",
      name: "JXA behind an MCP server",
      summary: "Script it.",
      fit: { "macos-only": "meets", dates: "partly" },
      chosen: true,
      reason: "It can read and change tasks.",
    },
  ],
};

const render = (c: unknown = comparison) => renderWithProject(OptionComparison, {}, undefined, makeProject({ comparison: c }));

describe("OptionComparison", () => {
  it("is a data table with a caption, column headers per option and row headers per constraint", async () => {
    const html = await render();
    expect(byName(html, "table")).toHaveLength(1);
    expect(html).toContain("Ways to reach OmniFocus");
    expect(byName(html, "caption")[0]!.attrs.id).toBe("options-caption");
    const cols = byName(html, "th").filter((t) => t.attrs.scope === "col");
    expect(cols).toHaveLength(3); // corner + two options
    const rows = byName(html, "th").filter((t) => t.attrs.scope === "row");
    expect(rows.length).toBeGreaterThanOrEqual(3); // Summary + two constraints
    expect(html).toContain("Works on macOS");
    expect(html).toContain("Runs on the Mac.");
    expect(html).toMatch(/<small[^>]*>\s*Runs on the Mac\./);
  });

  it("wraps the table in a keyboard-reachable named region", async () => {
    const html = await render();
    const region = byName(html, "div").find((d) => d.attrs.role === "region")!;
    expect(region.attrs.tabindex).toBe("0");
    expect(region.attrs["aria-labelledby"]).toBe("options-caption");
    expect(region.attrs["data-comparison"]).toBeDefined();
  });

  it("marks the chosen option in text and with data-chosen, and gives the reason", async () => {
    const html = await render();
    const chosen = byName(html, "th").filter((t) => t.attrs["data-chosen"] !== undefined);
    expect(chosen).toHaveLength(1);
    expect(html).toContain("Chosen");
    expect(html).toContain("Why JXA behind an MCP server was chosen.");
    expect(html).toContain("It can read and change tasks.");
    expect(byName(html, "p").some((p) => p.attrs["data-reason"] !== undefined)).toBe(true);
  });

  it("shows fit as text with a decorative mark hidden from assistive technology", async () => {
    const html = await render();
    expect(html).toContain("Meets");
    expect(html).toContain("Partly");
    expect(html).toContain("Misses");
    expect(byName(html, "span").filter((s) => s.attrs["aria-hidden"] === "true").length).toBeGreaterThanOrEqual(4);
  });

  it("adds In its favour and Against it rows only when some option has them", async () => {
    const html = await render();
    expect(html).toContain("Against it");
    expect(html).not.toContain("In its favour");
    expect(html).toContain("Cannot read tasks back.");
    const withPros = await render({
      ...comparison,
      options: [{ ...comparison.options[0]!, pros: ["Simple."] }, comparison.options[1]],
    });
    expect(withPros).toContain("In its favour");
    const neither = await render({
      ...comparison,
      options: [{ ...comparison.options[0]!, cons: undefined }, comparison.options[1]],
    });
    expect(neither).not.toContain("Against it");
    expect(neither).not.toContain("In its favour");
  });

  it("leaves an empty cell for an option with no list", async () => {
    const html = await render();
    const cells = byName(html, "td");
    // Against it row: URL scheme has cons, JXA has none.
    expect(cells.length).toBeGreaterThan(0);
    expect(html).toMatch(/<td[^>]*>\s*<\/td>/);
  });

  it("uses no script", async () => {
    expect(byName(await render(), "script")).toHaveLength(0);
  });

  it("fails naming the file when there is no comparison", async () => {
    await expect(render(null)).rejects.toThrow("src/content/projects/focus-pocus.mdx");
  });
});
