// prepareQuestionSource() (specs/022 research R3 and R4, data-model section 1).
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prepareQuestionSource } from "../../../src/lib/questions/source.ts";
import { MAX_INPUT_CHARS } from "../../../worker/src/questions/config.ts";

const base = { slug: "a-post", title: "A title", summary: "A summary.", body: "First paragraph.\n\nSecond paragraph.\n" };

describe("prepareQuestionSource: hash", () => {
  it("is the SHA-256 of JSON.stringify([title, summary, raw body]) in lowercase hex", () => {
    const expected = createHash("sha256")
      .update(JSON.stringify([base.title, base.summary, base.body]))
      .digest("hex");
    const { hash } = prepareQuestionSource(base);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(expected);
  });

  it("changes when the title, the summary or the body changes", () => {
    const original = prepareQuestionSource(base).hash;
    expect(prepareQuestionSource({ ...base, title: "Other" }).hash).not.toBe(original);
    expect(prepareQuestionSource({ ...base, summary: "Other." }).hash).not.toBe(original);
    expect(prepareQuestionSource({ ...base, body: `${base.body}More.` }).hash).not.toBe(original);
  });

  it("does not change when only unrelated front matter would change (it is not an input)", () => {
    const extra = { ...base, date: "2026-01-01", topics: ["x"] } as typeof base;
    expect(prepareQuestionSource(extra).hash).toBe(prepareQuestionSource(base).hash);
  });

  it("keeps the slug, title and summary", () => {
    expect(prepareQuestionSource(base)).toMatchObject({ slug: "a-post", title: "A title", summary: "A summary." });
  });
});

describe("prepareQuestionSource: text", () => {
  const text = (body: string) => prepareQuestionSource({ ...base, body }).text;

  it("keeps plain paragraphs and collapses whitespace inside them", () => {
    expect(text("One   two\nthree.\n\n\n\nNext   one.")).toBe("One two three.\n\nNext one.");
  });

  it("drops MDX import and export lines", () => {
    expect(text('import Figure from "../x.astro";\nexport const a = 1;\n\nBody.')).toBe("Body.");
  });

  it("drops JSX and HTML tags but keeps the words between them", () => {
    expect(text("Some <em>emphasis</em> and <Figure src={x} alt=\"y\" /> here.")).toBe("Some emphasis and here.");
  });

  it("drops image syntax", () => {
    expect(text("Before ![alt text](./pic.png) after.")).toBe("Before after.");
  });

  it("replaces fenced code with [code example]", () => {
    expect(text("Intro.\n\n```ts\nconst a = 1;\n```\n\nOutro.")).toBe("Intro.\n\n[code example]\n\nOutro.");
  });

  it("keeps link text without the address", () => {
    expect(text("See [the docs](https://example.com/docs) now.")).toBe("See the docs now.");
  });

  it("cuts at the last paragraph boundary before the cap", () => {
    const paragraph = "word ".repeat(200).trim();
    const body = Array.from({ length: 40 }, () => paragraph).join("\n\n");
    const result = text(body);
    expect(result.length).toBeLessThanOrEqual(MAX_INPUT_CHARS);
    expect(result.length).toBeGreaterThan(MAX_INPUT_CHARS - paragraph.length - 2);
    expect(result.endsWith(paragraph)).toBe(true);
  });

  it("hashes the raw body, not the cut text", () => {
    const body = Array.from({ length: 40 }, (_, i) => `Paragraph ${i} ${"word ".repeat(200)}`).join("\n\n");
    const { hash } = prepareQuestionSource({ ...base, body });
    expect(hash).toBe(createHash("sha256").update(JSON.stringify([base.title, base.summary, body])).digest("hex"));
  });
});
