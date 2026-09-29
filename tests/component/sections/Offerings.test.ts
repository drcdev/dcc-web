import { describe, expect, it } from "vitest";
import Offering from "../../../src/components/sections/Offering.astro";
import Offerings from "../../../src/components/sections/Offerings.astro";
import { byName, textOf } from "../html.ts";
import { render } from "./helpers.ts";

async function items() {
  return (
    (await render(Offering, { title: "Architecture reviews", href: "/services/#reviews" }, "<p>An outside view.</p>")) +
    (await render(Offering, { title: "Advisory retainers" }, "<p>A few hours a month.</p>"))
  );
}

describe("Offering", () => {
  it("renders a list item with an h3 title and a description", async () => {
    const html = await render(Offering, { title: "Reviews" }, "<p>An outside view.</p>");
    expect(byName(html, "li")).toHaveLength(1);
    expect(textOf(html, "h3")).toBe("Reviews");
    expect(html).toContain("An outside view.");
    expect(byName(html, "a")).toHaveLength(0);
  });

  it("renders the title as a link when href is set", async () => {
    const html = await render(Offering, { title: "Reviews", href: "/services/#reviews" }, "<p>x</p>");
    const [a] = byName(html, "a");
    expect(a!.attrs.href).toBe("/services/#reviews");
    expect(textOf(html, "a")).toBe("Reviews");
  });

  it("throws naming the section for a missing title, description or a bad address", async () => {
    await expect(render(Offering, {}, "<p>x</p>")).rejects.toThrow(/<Offering>.*title/s);
    await expect(render(Offering, { title: "T" }, "")).rejects.toThrow(/<Offering>.*description/s);
    await expect(render(Offering, { title: "T", href: "services" }, "<p>x</p>")).rejects.toThrow(/<Offering>.*href/s);
  });
});

describe("Offerings", () => {
  it("renders an h2 title and a list; item titles are h3 under a title", async () => {
    const html = await render(Offerings, { title: "What I offer" }, await items());
    expect(textOf(html, "h2")).toBe("What I offer");
    expect(byName(html, "ul")).toHaveLength(1);
    expect(byName(html, "li")).toHaveLength(2);
    expect(byName(html, "h3")).toHaveLength(2);
    expect(html.indexOf("Architecture reviews")).toBeLessThan(html.indexOf("Advisory retainers"));
  });

  it("makes item titles h2 when the list has no title, so levels never skip", async () => {
    const html = await render(Offerings, {}, await items());
    expect(byName(html, "h3")).toHaveLength(0);
    expect(byName(html, "h2")).toHaveLength(2);
    expect(byName(html, "li")).toHaveLength(2);
  });

  it("throws naming the section when there is no Offering inside", async () => {
    await expect(render(Offerings, { title: "T" }, "<p>Nothing</p>")).rejects.toThrow(/<Offerings>.*Offering/s);
  });
});
