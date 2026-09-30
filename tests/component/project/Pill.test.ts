import { describe, expect, it } from "vitest";
import Pill from "../../../src/components/Pill.astro";
import { byName, textOf } from "../html.ts";
import { render } from "../sections/helpers.ts";

describe("Pill", () => {
  it("renders a plain label with no link", async () => {
    const html = await render(Pill, {}, "Automation");
    expect(byName(html, "span")).toHaveLength(1);
    expect(byName(html, "a")).toHaveLength(0);
    expect(textOf(html, "span")).toBe("Automation");
  });

  it("carries the tone as data and renders a link when href is given", async () => {
    const html = await render(Pill, { tone: "sage", href: "/blog/tag/x/" }, "X");
    const [a] = byName(html, "a");
    expect(a!.attrs.href).toBe("/blog/tag/x/");
    expect(a!.attrs["data-tone"]).toBe("sage");
    expect(byName(html, "script")).toHaveLength(0);
  });

  it("uses one pill style for every tone", async () => {
    const a = await render(Pill, { tone: "sage" }, "A");
    const b = await render(Pill, { tone: "rust" }, "A");
    const shape = (html: string) =>
      (byName(html, "span")[0]!.attrs.class ?? "")
        .split(" ")
        .filter((c) => !/sage|rust/.test(c))
        .join(" ");
    expect(shape(a)).toBe(shape(b));
    expect(a).toContain("data-pill");
  });
});
