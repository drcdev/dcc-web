// OptionTabs pre-script markup (T039; contracts/islands.md).
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "../../sections/helpers.ts";
import { byName, tags } from "../../html.ts";
import OptionTabs from "../../../../src/prototypes/portfolio/b/OptionTabs.astro";
import { focusPocus } from "../../../../src/prototypes/portfolio/sample.ts";

let html = "";
beforeAll(async () => {
  html = await render(OptionTabs, { options: focusPocus.options });
});

describe("OptionTabs before any script runs", () => {
  it("has the option-tabs element and every option card visible", () => {
    expect(byName(html, "option-tabs")).toHaveLength(1);
    const cards = tags(html).filter((t) => "data-option" in t.attrs);
    expect(cards.map((c) => c.attrs["data-option"])).toEqual(focusPocus.options.map((o) => o.id));
    for (const c of cards) expect("hidden" in c.attrs).toBe(false);
  });

  it("shows every option's content, and the chosen one with its reason", () => {
    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ");
    for (const o of focusPocus.options) {
      expect(text).toContain(o.name);
      expect(text).toContain(o.summary);
      for (const line of [...o.pros, ...o.cons]) expect(text).toContain(line);
    }
    const chosen = focusPocus.options.find((o) => o.chosen)!;
    expect(text).toContain("Chosen");
    expect(text).toContain(chosen.reason!);
    expect(tags(html).filter((t) => "data-chosen" in t.attrs)).toHaveLength(1);
  });

  it("hides the tab buttons without JavaScript and gives them a 24 px target", () => {
    const list = tags(html).find((t) => "data-tablist" in t.attrs)!;
    expect(list.attrs.class).toMatch(/\bhidden\b/);
    expect(list.attrs.class).toContain("js:flex");
    expect(html).not.toContain('role="tablist"');
    const buttons = byName(html, "button");
    expect(buttons).toHaveLength(focusPocus.options.length);
    for (const b of buttons) {
      expect(b.attrs.type).toBe("button");
      expect(b.attrs.class).toMatch(/\bmin-h-(8|9|10|11|12)\b/);
      expect(b.attrs.class).toMatch(/\bmin-w-8\b/);
    }
  });
});
