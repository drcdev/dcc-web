// CareerTimeline (specs/041-career-timeline US1; contracts/timeline-markup.md). Neutral content only.
import { describe, expect, it } from "vitest";
import CareerTimeline from "../../../src/components/sections/CareerTimeline.astro";
import { buildTimeline, type StepFile } from "../../../src/lib/content/career.ts";
import { byName, tags, textOf } from "../html.ts";
import { render } from "./helpers.ts";

const file = (id: string, start: string, end: string, extra: Partial<StepFile["data"]> = {}): StepFile => ({
  id,
  file: `src/content/career/${id}.yaml`,
  data: { role: `Role ${id}`, organization: `Org ${id}`, start, end, scope: `Scope of ${id}.`, ...extra },
});

const timeline = buildTimeline([
  file("one", "2010-03", "2013-08", {
    decision: "A decision.",
    wish: "A wish.",
    nextMove: "A next move.",
    achievements: ["Did a thing."],
    leadership: ["Led a thing."],
    awards: [{ name: "Linked Award", year: 2012, href: "https://example.com/a" }, { name: "Plain Award", year: 2013 }],
  }),
  file("two", "2018-01", "present", { achievements: ["Another thing."] }),
]);

describe("CareerTimeline", () => {
  it("heads the section 'Career' (h3) and renders an ordered list of steps in order, all closed", async () => {
    const html = await render(CareerTimeline, { timeline });
    expect(textOf(html, "h3")).toBe("Career");
    expect(byName(html, "ol")).toHaveLength(1);
    const items = tags(html).filter((t) => t.name === "li" && t.attrs["data-step"]);
    expect(items.map((i) => i.attrs["data-step"])).toEqual(["one", "two"]);
    const details = byName(html, "details");
    expect(details).toHaveLength(2);
    for (const d of details) expect("open" in d.attrs).toBe(false);
  });

  it("shows role, organization and period in the summary, with a hidden dash and 'to' for screen readers", async () => {
    const html = await render(CareerTimeline, { timeline });
    const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(html)![1]!;
    const text = summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(text).toBe("Role one Org one Mar 2010 – to Aug 2013");
    expect(summary).toContain('aria-hidden="true"');
    expect(summary).toContain("sr-only");
    expect(tags(summary).filter((t) => t.name === "time").map((t) => t.attrs.datetime)).toEqual(["2010-03", "2013-08"]);
  });

  it("ends a running period with the word present, not a time element", async () => {
    const html = await render(CareerTimeline, { timeline });
    const second = html.split('data-step="two"')[1]!;
    const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(second)![1]!;
    expect(summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).toContain("present");
    expect(tags(summary).filter((t) => t.name === "time")).toHaveLength(1);
  });

  it("labels each detail part as a term and description, in order, and only those present", async () => {
    const html = await render(CareerTimeline, { timeline });
    const first = html.split('data-step="one"')[1]!.split('data-step="two"')[0]!;
    const terms = [...first.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => m[1]!.trim().replace(/&#39;/g, "'"));
    expect(terms).toEqual(["Scope", "Key decision", "What I wish I'd known", "The skill that led to the next move"]);
    const second = html.split('data-step="two"')[1]!;
    expect([...second.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => m[1]!.trim())).toEqual(["Scope"]);
    expect(second).not.toContain("next move");
  });

  it("shows Achievements, Leadership and Awards lists with h4 headings, only when they have items", async () => {
    const html = await render(CareerTimeline, { timeline });
    const first = html.split('data-step="one"')[1]!.split('data-step="two"')[0]!;
    expect([...first.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map((m) => m[1]!.trim())).toEqual(["Achievements", "Leadership", "Awards"]);
    const second = html.split('data-step="two"')[1]!;
    expect([...second.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map((m) => m[1]!.trim())).toEqual(["Achievements"]);
    expect(tags(first).filter((t) => t.name === "ul" && t.attrs["data-list"]).map((t) => t.attrs["data-list"])).toEqual([
      "achievements",
      "leadership",
      "awards",
    ]);
  });

  it("links an award with an address and leaves one without as plain text, the year after the name", async () => {
    const html = await render(CareerTimeline, { timeline });
    expect(html).toMatch(/<a [^>]*href="https:\/\/example\.com\/a"[^>]*>Linked Award<\/a>\s*\(2012\)/);
    expect(html).toMatch(/<li[^>]*>\s*Plain Award \(2013\)\s*<\/li>/);
    expect(tags(html).filter((t) => t.name === "a")).toHaveLength(1);
  });

  it("renders field text as text: no markup, no line break kept", async () => {
    const odd = buildTimeline([file("x", "2010-01", "present", { scope: "Has <b>bold</b> and *stars*\nand a break." })]);
    const html = await render(CareerTimeline, { timeline: odd });
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(html).toContain("*stars* and a break.");
  });

  it("sets no inline style attribute and ships no script", async () => {
    const html = await render(CareerTimeline, { timeline });
    expect(tags(html).filter((t) => "style" in t.attrs)).toEqual([]);
    expect(html).not.toContain("<script");
  });

  it("renders nothing with no steps", async () => {
    const html = await render(CareerTimeline, { timeline: { steps: [], categories: [] } });
    expect(html.trim()).toBe("");
  });
});
