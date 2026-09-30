// CodeBlock replaces the Markdown `pre` (contracts/blog-pages.md "Code block";
// research R8; FR-024, FR-025): a figure with a copy button that is hidden until
// scripts run, a polite status region, the highlighted `pre` and an optional
// caption. No `style` attribute anywhere (FR-053).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import CodeBlock from "../../../src/components/post/CodeBlock.astro";
import { byName, classList, tags } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const code = '<code><span class="line"><span class="hl-keyword">const</span> a = 1;</span></code>';
const render = (props: Record<string, unknown> = {}) =>
  container.renderToString(CodeBlock, {
    props: { class: "astro-code", tabindex: "0", "data-language": "ts", ...props },
    slots: { default: code },
  });

describe("CodeBlock", () => {
  it("is one figure marked data-code-block holding the pre and its code", async () => {
    const html = await render();
    const figures = byName(html, "figure");
    expect(figures).toHaveLength(1);
    expect("data-code-block" in figures[0]!.attrs).toBe(true);
    const [pre] = byName(html, "pre");
    expect(classList(pre!)).toContain("astro-code");
    expect(pre!.attrs["data-language"]).toBe("ts");
    expect(html).toContain('<span class="hl-keyword">const</span>');
  });

  it("keeps the pre keyboard reachable with tabindex 0", async () => {
    const [pre] = byName(await render({ tabindex: undefined }), "pre");
    expect(pre!.attrs.tabindex).toBe("0");
  });

  it("hides the copy button until scripts run and adds a polite status region", async () => {
    const html = await render();
    const [button] = byName(html, "button");
    expect(button!.attrs.type).toBe("button");
    expect("hidden" in button!.attrs).toBe(true);
    expect(html).toMatch(/<button[^>]*>\s*Copy code\s*<\/button>/);
    const status = tags(html).filter((t) => t.attrs.role === "status");
    expect(status).toHaveLength(1);
    expect(classList(status[0]!)).toContain("sr-only");
    expect(html.indexOf("<copy-code")).toBeLessThan(html.indexOf("<button"));
    expect(html.indexOf("<button")).toBeLessThan(html.indexOf("<pre"));
  });

  it("shows a figcaption after the code and names it on the button when there is a caption", async () => {
    const html = await render({ "data-caption": "Reading a setting" });
    expect(html).toMatch(/<figcaption[^>]*>\s*Reading a setting\s*<\/figcaption>/);
    expect(html.indexOf("<figcaption")).toBeGreaterThan(html.indexOf("</pre>"));
    expect(byName(html, "button")[0]!.attrs["aria-label"]).toBe("Copy code: Reading a setting");
  });

  it("has no figcaption and no aria-label without a caption", async () => {
    const html = await render();
    expect(byName(html, "figcaption")).toHaveLength(0);
    expect(byName(html, "button")[0]!.attrs["aria-label"]).toBeUndefined();
  });

  it("never renders a style attribute", async () => {
    const html = await render({ style: "background-color:#000" });
    expect(html.replace(/<script[\s\S]*?<\/script>/g, "")).not.toMatch(/\sstyle=/);
  });
});
