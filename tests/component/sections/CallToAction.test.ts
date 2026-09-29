import { describe, expect, it } from "vitest";
import CallToAction from "../../../src/components/sections/CallToAction.astro";
import { byName, focusable } from "../html.ts";
import { render } from "./helpers.ts";

describe("CallToAction", () => {
  it("renders one focusable link with the label, and the optional message", async () => {
    const html = await render(CallToAction, { label: "Get in touch", href: "/contact/" }, "<p>A question?</p>");
    const links = byName(html, "a");
    expect(links).toHaveLength(1);
    expect(links[0]!.attrs.href).toBe("/contact/");
    expect(html).toMatch(/<a[^>]*>\s*Get in touch\s*<\/a>/);
    expect(focusable(html)).toHaveLength(1);
    expect(html).toContain("A question?");
  });

  it("works without a message", async () => {
    const html = await render(CallToAction, { label: "Go", href: "https://example.com/" });
    expect(byName(html, "a")).toHaveLength(1);
  });

  it("throws naming the section and the missing or invalid prop", async () => {
    await expect(render(CallToAction, { label: "x" })).rejects.toThrow(/<CallToAction>.*href/s);
    await expect(render(CallToAction, { href: "/x/" })).rejects.toThrow(/<CallToAction>.*label/s);
    await expect(render(CallToAction, { label: "x", href: "contact" })).rejects.toThrow(/<CallToAction>.*href/s);
  });
});
