// QuestionsPanel (specs/022 contracts/questions-panel.md P02, P06, P07, P08, P09, P14; FR-012).
// The prerendered markup of the panel; its behaviour is tests/e2e/questions.spec.ts.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import QuestionsPanel from "../../../src/components/post/QuestionsPanel.astro";
import { byName, classList, tags, textOf } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
});

const HASH = "ab".repeat(32);
const render = () => container.renderToString(QuestionsPanel, { props: { slug: "some-post", hash: HASH } });
const attr = (html: string, name: string) => tags(html).find((t) => name in t.attrs);

describe("QuestionsPanel markup", () => {
  it("is an aside landmark named 'Think while you read' by aria-label (D03, P07 replaced)", async () => {
    const html = await render();
    const aside = attr(html, "data-questions")!;
    expect(aside.name).toBe("aside");
    expect(aside.attrs["aria-label"]).toBe("Think while you read");
    expect("aria-labelledby" in aside.attrs).toBe(false);
    expect(byName(html, "h2")).toHaveLength(1);
  });

  it("has a toggle button with two exact lines and an aria-hidden chevron (D02, D04)", async () => {
    const html = await render();
    const toggle = attr(html, "data-questions-toggle")!;
    expect(toggle.name).toBe("button");
    expect(toggle.attrs.type).toBe("button");
    expect(toggle.attrs["aria-expanded"]).toBe("false");
    expect(toggle.attrs["aria-controls"]).toBe("questions-content");
    const h2 = /<h2\b[^>]*>([\s\S]*?)<\/h2>/.exec(html)![1]!;
    expect(h2).toContain("data-questions-toggle");
    const button = /<button\b[^>]*data-questions-toggle[^>]*>([\s\S]*?)<\/button>/.exec(html)![1]!;
    const lines = [...button.matchAll(/<span\b[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]!.trim()).filter(Boolean);
    expect(lines).toEqual(["Think while you read", "Optional AI critical thinking questions"]);
    const svg = byName(button, "svg");
    expect(svg).toHaveLength(1);
    expect(svg[0]!.attrs["aria-hidden"]).toBe("true");
  });

  it("has a wide heading span reading exactly 'Think while you read' (D03)", async () => {
    const html = await render();
    const h2 = /<h2\b[^>]*>([\s\S]*?)<\/h2>/.exec(html)![1]!;
    const wide = [...h2.matchAll(/<span\b([^>]*)>([^<]*)<\/span>/g)].find((m) => /xl:inline/.test(m[1]!));
    expect(wide).toBeTruthy();
    expect(wide![2]!.trim()).toBe("Think while you read");
    expect(classList({ name: "span", attrs: { class: /class="([^"]*)"/.exec(wide![1]!)![1]! }, index: 0, raw: "" })).toContain("hidden");
  });

  it("wraps the content in #questions-content (D04)", async () => {
    const html = await render();
    const content = attr(html, "data-questions-content")!;
    expect(content.attrs.id).toBe("questions-content");
    const start = html.indexOf("data-questions-content");
    for (const marker of ["Get a few questions", "data-questions-get", "data-questions-status", "data-questions-list", "data-questions-note"]) {
      expect(html.indexOf(marker), marker).toBeGreaterThan(start);
    }
    expect(html.match(/aria-live=/g)).toHaveLength(1);
  });

  it("carries the slug and hash as data attributes (P02)", async () => {
    const aside = attr(await render(), "data-questions")!;
    expect(aside.attrs["data-slug"]).toBe("some-post");
    expect(aside.attrs["data-hash"]).toBe(HASH);
  });

  it("is hidden until the js class is on the root (P05)", async () => {
    const aside = attr(await render(), "data-questions")!;
    const classes = classList(aside);
    expect(classes).toContain("hidden");
    expect(classes).toContain("[.js_&]:block");
  });

  it("has the plain-language copy (P14)", async () => {
    const html = await render();
    expect(html).toContain("Get a few questions to keep in mind while you read this post.");
    expect(html).toContain("These questions were written by an AI model from the post text. They may be imperfect.");
    expect(textOf(html, "button")).toContain("Think while you read");
    expect(html).toMatch(/data-questions-get[^>]*>\s*Get questions\s*</);
    const buttons = byName(html, "button");
    expect(buttons).toHaveLength(3);
    expect(html).toMatch(/data-questions-new[^>]*>\s*New questions\s*</);
  });

  it("has an empty polite status region in the prerendered DOM (P08)", async () => {
    const html = await render();
    const status = attr(html, "data-questions-status")!;
    expect(status.attrs.role).toBe("status");
    expect(status.attrs["aria-live"]).toBe("polite");
    expect(html).toMatch(/data-questions-status[^>]*>\s*<\/p>/);
    expect(html.match(/aria-live=/g)).toHaveLength(1);
    expect(html).not.toContain("aria-busy");
  });

  it("starts with the list, the AI note and New questions hidden", async () => {
    const html = await render();
    const list = attr(html, "data-questions-list")!;
    expect(list.name).toBe("ol");
    for (const name of ["data-questions-list", "data-questions-note", "data-questions-new"]) {
      expect("hidden" in attr(html, name)!.attrs, name).toBe(true);
    }
    expect("hidden" in attr(html, "data-questions-get")!.attrs).toBe(false);
  });

  it("orders heading, sentence, buttons, status, list, note (P09)", async () => {
    const html = await render();
    const order = ["<h2", "data-questions-content", "Get a few questions", "data-questions-get", "data-questions-new", "data-questions-status", "data-questions-list", "data-questions-note"];
    const positions = order.map((marker) => html.indexOf(marker));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("uses no style attribute, no inline handler and no animation (P06, FR-012)", async () => {
    const html = await render();
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/\son[a-z]+=/);
    for (const tag of tags(html)) {
      for (const name of classList(tag)) {
        expect(name, name).not.toMatch(/(^|:)animate-|(^|:)transition/);
      }
    }
  });

  it("has type=button on every button so nothing submits", async () => {
    for (const button of byName(await render(), "button")) expect(button.attrs.type).toBe("button");
  });
});
