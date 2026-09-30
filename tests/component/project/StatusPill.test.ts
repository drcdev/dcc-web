import { describe, expect, it } from "vitest";
import StatusPill from "../../../src/components/project/StatusPill.astro";
import { byName, textOf } from "../html.ts";
import { render } from "../sections/helpers.ts";

describe("StatusPill", () => {
  it.each([
    ["shipped", "Shipped"],
    ["experiment", "Experiment"],
    ["in-progress", "In progress"],
  ])("shows %s as text", async (status, label) => {
    const html = await render(StatusPill, { status });
    const tag = byName(html, "span").find((t) => t.attrs["data-status"]);
    expect(tag!.attrs["data-status"]).toBe(status);
    expect(textOf(html, "span")).toContain(label);
  });
});
