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

const known = new Map([
  ["p1", { title: "First <post>", draft: false }],
  ["p2", { title: "Second post", draft: false }],
]);

const timeline = buildTimeline([
  file("one", "2010-03", "2013-08", {
    decision: "A decision.",
    wish: "A wish.",
    nextMove: "A next move.",
    achievements: ["Did a thing."],
    leadership: ["Led a thing."],
    posts: ["p1", "p2"],
    awards: [{ name: "Linked Award", year: 2012, href: "https://example.com/a" }, { name: "Plain Award", year: 2013 }],
  }),
  file("two", "2018-01", "present", { achievements: ["Another thing."] }),
], known);

/** One step's markup, whatever the list order: from its data-step attribute to the next step's. */
const stepBlock = (html: string, id: string): string => html.split('data-step="').find((chunk) => chunk.startsWith(`${id}"`))!;

describe("CareerTimeline", () => {
  it("heads the section 'Career' (h3) and renders an ordered list of steps in order, all closed", async () => {
    const html = await render(CareerTimeline, { timeline });
    expect(textOf(html, "h3")).toBe("Career");
    expect(byName(html, "ol")).toHaveLength(1);
    const items = tags(html).filter((t) => t.name === "li" && t.attrs["data-step"]);
    expect(items.map((i) => i.attrs["data-step"])).toEqual(["two", "one"]);
    expect(byName(html, "ol")[0]!.attrs).not.toHaveProperty("reversed");
    const details = byName(html, "details");
    expect(details).toHaveLength(2);
    for (const d of details) expect("open" in d.attrs).toBe(false);
  });

  it("shows role, organization and period in the summary, with a hidden dash and 'to' for screen readers", async () => {
    const html = await render(CareerTimeline, { timeline });
    const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(stepBlock(html, "one"))![1]!;
    const text = summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(text).toBe("Role one Org one Mar 2010 – to Aug 2013");
    expect(summary).toContain('aria-hidden="true"');
    expect(summary).toContain("sr-only");
    expect(tags(summary).filter((t) => t.name === "time").map((t) => t.attrs.datetime)).toEqual(["2010-03", "2013-08"]);
  });

  it("ends a running period with the word present, not a time element", async () => {
    const html = await render(CareerTimeline, { timeline });
    const second = stepBlock(html, "two");
    const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(second)![1]!;
    expect(summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).toContain("present");
    expect(tags(summary).filter((t) => t.name === "time")).toHaveLength(1);
  });

  it("labels each detail part as a term and description, in order, and only those present", async () => {
    const html = await render(CareerTimeline, { timeline });
    const first = stepBlock(html, "one");
    const terms = [...first.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => m[1]!.trim().replace(/&#39;/g, "'"));
    expect(terms).toEqual(["Scope", "Key decision", "What I wish I'd known", "The skill that led to the next move"]);
    const second = stepBlock(html, "two");
    expect([...second.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => m[1]!.trim())).toEqual(["Scope"]);
    expect(second).not.toContain("next move");
  });

  it("shows Achievements, Leadership and Awards lists with h4 headings, only when they have items", async () => {
    const html = await render(CareerTimeline, { timeline });
    const first = stepBlock(html, "one");
    expect([...first.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map((m) => m[1]!.trim())).toEqual(["Achievements", "Leadership", "Writing", "Awards"]);
    const second = stepBlock(html, "two");
    expect([...second.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map((m) => m[1]!.trim())).toEqual(["Achievements"]);
    expect(tags(first).filter((t) => t.name === "ul" && t.attrs["data-list"]).map((t) => t.attrs["data-list"])).toEqual([
      "achievements",
      "leadership",
      "posts",
      "awards",
    ]);
  });

  it("links an award with an address and leaves one without as plain text, the year after the name", async () => {
    const html = await render(CareerTimeline, { timeline });
    expect(html).toMatch(/<a [^>]*href="https:\/\/example\.com\/a"[^>]*>Linked Award<\/a>\s*\(2012\)/);
    expect(html).toMatch(/<li[^>]*>\s*Plain Award \(2013\)\s*<\/li>/);
    expect(tags(html).filter((t) => t.name === "a" && t.attrs.href?.startsWith("https://"))).toHaveLength(1);
  });

  it("lists related posts as links to each post's own title and address, in the listed order", async () => {
    const html = await render(CareerTimeline, { timeline });
    const first = stepBlock(html, "one");
    const list = /<ul[^>]*data-list="posts"[^>]*>([\s\S]*?)<\/ul>/.exec(first)![1]!;
    const links = tags(list).filter((t) => t.name === "a");
    expect(links.map((l) => l.attrs.href)).toEqual(["/writing/p1/", "/writing/p2/"]);
    expect(list).toContain("First &lt;post&gt;");
    expect(list).toContain("Second post");
  });

  it("leaves out the Writing and Awards lists when a step has none", async () => {
    const html = await render(CareerTimeline, { timeline });
    const second = stepBlock(html, "two");
    expect(second).not.toContain('data-list="posts"');
    expect(second).not.toContain('data-list="awards"');
    expect(second).not.toContain("Writing");
  });

  it("renders field text as text: no markup, no line break kept", async () => {
    const odd = buildTimeline([file("x", "2010-01", "present", { scope: "Has <b>bold</b> and *stars*\nand a break." })]);
    const html = await render(CareerTimeline, { timeline: odd });
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(html).toContain("*stars* and a break.");
  });

  it("sets no inline style attribute and no inline script (the filter script is a bundled module)", async () => {
    const html = await render(CareerTimeline, { timeline });
    expect(tags(html).filter((t) => "style" in t.attrs)).toEqual([]);
    expect(tags(html).filter((t) => t.name === "script" && !t.attrs.src)).toEqual([]);
  });

  it("serves the filter and status line hidden, offering only used categories with All first and selected", async () => {
    const html = await render(CareerTimeline, { timeline });
    const group = tags(html).find((t) => "data-career-filter" in t.attrs)!;
    expect(group.attrs.role).toBe("group");
    expect("hidden" in group.attrs).toBe(true);
    expect(group.attrs["aria-labelledby"]).toBe("career-filter-label");
    expect(textOf(html, "p")).toContain("Show");
    const buttons = tags(html).filter((t) => t.name === "button");
    expect(buttons.map((b) => b.attrs["data-category"] ?? "all")).toEqual(["all", "achievements", "leadership", "awards"]);
    expect(buttons.map((b) => b.attrs["aria-pressed"])).toEqual(["true", "false", "false", "false"]);
    expect("data-category-all" in buttons[0]!.attrs).toBe(true);
    for (const b of buttons) expect(b.attrs.type).toBe("button");
    const status = tags(html).find((t) => "data-career-status" in t.attrs)!;
    expect(status.attrs.role).toBe("status");
    expect(status.attrs["aria-live"]).toBe("polite");
    expect("hidden" in status.attrs).toBe(true);
    expect(/<p[^>]*data-career-status[^>]*>\s*<\/p>/.test(html)).toBe(true);
  });

  it("offers a category only when a step uses it", async () => {
    const only = buildTimeline([file("x", "2010-01", "present", { awards: [{ name: "A", year: 2020 }] })]);
    const html = await render(CareerTimeline, { timeline: only });
    expect(tags(html).filter((t) => t.name === "button").map((b) => b.attrs["data-category"] ?? "all")).toEqual(["all", "awards"]);
  });

  it("wraps the steps in the custom element with the total and gives each step its categories", async () => {
    const html = await render(CareerTimeline, { timeline });
    const el = tags(html).find((t) => t.name === "career-timeline")!;
    expect(el.attrs["data-total"]).toBe("2");
    const items = tags(html).filter((t) => t.name === "li" && t.attrs["data-step"]);
    expect(items.map((i) => i.attrs["data-categories"])).toEqual(["achievements", "achievements|leadership|awards"]);
  });

  it("renders no filter and no status line when no category is used", async () => {
    const none = buildTimeline([file("x", "2010-01", "present")]);
    const html = await render(CareerTimeline, { timeline: none });
    expect(html).not.toContain("data-career-filter");
    expect(html).not.toContain("data-career-status");
    expect(byName(html, "button")).toHaveLength(0);
  });

  it("renders nothing with no steps", async () => {
    const html = await render(CareerTimeline, { timeline: { steps: [], categories: [] } });
    expect(html).not.toContain("<section");
    expect(html).not.toContain("<career-timeline");
  });
});
