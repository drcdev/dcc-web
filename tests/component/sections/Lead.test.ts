import { describe, expect, it } from "vitest";
import Lead from "../../../src/components/sections/Lead.astro";
import { byName } from "../html.ts";
import { render } from "./helpers.ts";

describe("Lead", () => {
  it("renders one lead paragraph", async () => {
    const html = await render(Lead, {}, "I help teams decide.");
    const [p] = byName(html, "p");
    expect(byName(html, "p")).toHaveLength(1);
    expect(p!.attrs.class).toContain("lead");
    expect(html).toContain("I help teams decide.");
  });

  it("does not nest a paragraph inside the lead paragraph", async () => {
    const html = await render(Lead, {}, "<p>Written as Markdown.</p>");
    expect(byName(html, "p")).toHaveLength(1);
    expect(html).toContain("Written as Markdown.");
  });

  it("throws an error naming the section when there is no text", async () => {
    await expect(render(Lead, {}, "  ")).rejects.toThrow(/<Lead>.*text/s);
  });
});
