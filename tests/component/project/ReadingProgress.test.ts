import { describe, expect, it } from "vitest";
import ReadingProgress from "../../../src/components/project/ReadingProgress.astro";
import { byName, tags } from "../html.ts";
import { render } from "../sections/helpers.ts";

describe("ReadingProgress", () => {
  it("is a decorative element with no text and no script", async () => {
    const html = await render(ReadingProgress);
    const bar = tags(html).filter((t) => "data-progress" in t.attrs);
    expect(bar).toHaveLength(1);
    expect(bar[0]!.attrs["aria-hidden"]).toBe("true");
    expect(html.replace(/<[^>]+>/g, "").trim()).toBe("");
    expect(byName(html, "script")).toHaveLength(0);
  });
});
