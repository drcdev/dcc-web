import { describe, expect, it } from "vitest";
import DraftMark from "../../../src/components/project/DraftMark.astro";
import { byName, textOf } from "../html.ts";
import { render } from "../sections/helpers.ts";

describe("DraftMark", () => {
  it("says 'Draft for review' in text, so it does not depend on colour", async () => {
    const html = await render(DraftMark);
    expect(byName(html, "span").filter((t) => "data-draft-mark" in t.attrs)).toHaveLength(1);
    expect(textOf(html, "span")).toBe("Draft for review");
  });
});
