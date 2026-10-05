// Unit tests for the section prop schemas (data-model.md "Section";
// contracts/sections.md; contracts/build-errors.md rows 11 and 12).
// Each schema validates the section's props together with a summary of what is
// inside it: `content: { text, images, offerings }`.
import { describe, expect, it } from "vitest";
import { sectionNames } from "../../../src/components/sections/index.ts";
import { sectionSchemas } from "../../../src/components/sections/schemas.ts";

const withContent = (props: object, content: Partial<{ text: boolean; images: number; offerings: number }> = {}) => ({
  ...props,
  content: { text: false, images: 0, offerings: 0, ...content },
});

const ok = (name: keyof typeof sectionSchemas, value: unknown) => sectionSchemas[name].safeParse(value).success;

describe("section registry", () => {
  it("lists the ten sections", () => {
    expect([...sectionNames].sort()).toEqual(
      [
        "CallToAction",
        "ContactForm",
        "Figure",
        "FullImage",
        "Lead",
        "Offering",
        "Offerings",
        "RecentWriting",
        "TextBlock",
        "WideImage",
      ].sort(),
    );
  });

  it("has a schema for every section", () => {
    expect(Object.keys(sectionSchemas).sort()).toEqual([...sectionNames].sort());
  });
});

describe("Lead", () => {
  it("needs text", () => {
    expect(ok("Lead", withContent({}, { text: true }))).toBe(true);
    expect(ok("Lead", withContent({}))).toBe(false);
  });
  it("takes no props", () => {
    expect(ok("Lead", withContent({ title: "x" }, { text: true }))).toBe(false);
  });
});

describe("TextBlock", () => {
  it("needs a title and text", () => {
    expect(ok("TextBlock", withContent({ title: "How I work" }, { text: true }))).toBe(true);
    expect(ok("TextBlock", withContent({}, { text: true }))).toBe(false);
    expect(ok("TextBlock", withContent({ title: "" }, { text: true }))).toBe(false);
    expect(ok("TextBlock", withContent({ title: "How I work" }))).toBe(false);
  });
});

describe("RecentWriting", () => {
  it("takes no props and needs no content inside it", () => {
    expect(ok("RecentWriting", withContent({}))).toBe(true);
    expect(ok("RecentWriting", withContent({ title: "x" }))).toBe(false);
  });
});

describe("Offerings and Offering", () => {
  it("Offerings needs at least one Offering and takes an optional title", () => {
    expect(ok("Offerings", withContent({}, { offerings: 1 }))).toBe(true);
    expect(ok("Offerings", withContent({ title: "What I offer" }, { offerings: 2 }))).toBe(true);
    expect(ok("Offerings", withContent({}))).toBe(false);
    expect(ok("Offerings", withContent({ title: "" }, { offerings: 1 }))).toBe(false);
  });
  it("Offering needs a title and a description, and takes an optional href", () => {
    expect(ok("Offering", withContent({ title: "Reviews" }, { text: true }))).toBe(true);
    expect(ok("Offering", withContent({ title: "Reviews", href: "/services/#reviews" }, { text: true }))).toBe(true);
    expect(ok("Offering", withContent({}, { text: true }))).toBe(false);
    expect(ok("Offering", withContent({ title: "Reviews" }))).toBe(false);
    // #95: a protocol-relative address is an off-site link, not an internal one.
    expect(ok("Offering", withContent({ title: "Reviews", href: "//example.com" }, { text: true }))).toBe(false);
    expect(ok("Offering", withContent({ title: "Reviews", href: "/\\example.com" }, { text: true }))).toBe(false);
  });
});

describe("CallToAction", () => {
  it("needs label and href; the message is optional", () => {
    expect(ok("CallToAction", withContent({ label: "Get in touch", href: "/contact/" }))).toBe(true);
    expect(ok("CallToAction", withContent({ label: "Get in touch", href: "https://example.com" }, { text: true }))).toBe(true);
    expect(ok("CallToAction", withContent({ label: "x" }))).toBe(false);
    expect(ok("CallToAction", withContent({ href: "/contact/" }))).toBe(false);
    expect(ok("CallToAction", withContent({ label: "x", href: "contact" }))).toBe(false);
    // #95: a protocol-relative address is an off-site link, not an internal one.
    expect(ok("CallToAction", withContent({ label: "x", href: "//example.com" }))).toBe(false);
    expect(ok("CallToAction", withContent({ label: "x", href: "/\\example.com" }))).toBe(false);
  });

  it("names the missing prop in the error", () => {
    const result = sectionSchemas.CallToAction.safeParse(withContent({ label: "x" }));
    expect(JSON.stringify(result.error?.issues)).toContain("href");
  });
});

describe.each(["Figure", "WideImage", "FullImage"] as const)("%s", (name) => {
  it("needs exactly one image; the caption is optional", () => {
    expect(ok(name, withContent({}, { images: 1 }))).toBe(true);
    expect(ok(name, withContent({ caption: "A caption" }, { images: 1 }))).toBe(true);
    expect(ok(name, withContent({}, { images: 0 }))).toBe(false);
    expect(ok(name, withContent({}, { images: 2 }))).toBe(false);
  });

  it("says an image is needed", () => {
    const result = sectionSchemas[name].safeParse(withContent({}));
    expect(JSON.stringify(result.error?.issues)).toContain("image");
  });

  it("rejects an empty caption and unknown props", () => {
    expect(ok(name, withContent({ caption: "" }, { images: 1 }))).toBe(false);
    expect(ok(name, withContent({ captoin: "x" }, { images: 1 }))).toBe(false);
  });
});

describe("ContactForm", () => {
  it("takes no props and needs no content", () => {
    expect(ok("ContactForm", withContent({}))).toBe(true);
    expect(ok("ContactForm", withContent({ title: "x" }))).toBe(false);
  });
});
