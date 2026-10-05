// Unit tests for the page collection schema (data-model.md "Page"; FR-004,
// FR-005, FR-007). `image()` is Astro's schema helper; a plain string stands in
// for it here so the schema can be tested without the content layer.
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { pageSchema } from "../../../src/content/schemas/page.ts";

const schema = pageSchema({ image: () => z.string() });

const minimal = { title: "Workshops", description: "Half-day and full-day workshops." };

const full = {
  ...minimal,
  image: { src: "./images/share.jpg", alt: "Don Coleman speaking" },
  featureImage: { src: "./images/stage.jpg", alt: "A conference stage", caption: "From 2025" },
  nav: { position: 3, label: "Talks" },
  draft: true,
  intro: {
    photo: { src: "./images/don.jpg", alt: "Don Coleman" },
    name: "Don Coleman",
    tagline: "A tagline",
    bio: "A short bio.",
    cta: { label: "See how I can help", href: "/services/" },
  },
};

const rejects = (value: unknown) => expect(schema.safeParse(value).success).toBe(false);

// Astro prints one line per issue as `**<path>**: <message>`; its errorMap is not public, so the
// tests format zod's issues the same way and assert a build-errors.md row's phrase against it.
const issueText = (value: unknown) => {
  const result = schema.safeParse(value);
  expect(result.success, "the schema should reject the value").toBe(false);
  return (result.error?.issues ?? []).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
};

describe("pageSchema", () => {
  it("accepts a minimal page and defaults draft to false", () => {
    const result = schema.safeParse(minimal);
    expect(result.success).toBe(true);
    expect(result.data?.draft).toBe(false);
  });

  it("accepts a page with every setting", () => {
    expect(schema.safeParse(full).success).toBe(true);
  });

  it("rejects a missing or empty title", () => {
    rejects({ description: "x" });
    rejects({ ...minimal, title: "" });
    rejects({ ...minimal, title: "   " });
  });

  it("rejects a missing or empty description", () => {
    rejects({ title: "x" });
    rejects({ ...minimal, description: "" });
  });

  it("rejects a nav position that is not a whole number of 1 or more", () => {
    rejects({ ...minimal, nav: { position: "second" } });
    rejects({ ...minimal, nav: { position: 0 } });
    rejects({ ...minimal, nav: { position: 1.5 } });
    rejects({ ...minimal, nav: {} });
    rejects({ ...minimal, nav: { position: 2, label: "" } });
  });

  it("rejects unknown keys at every level", () => {
    rejects({ ...minimal, titel: "Oops" });
    rejects({ ...minimal, nav: { position: 2, lable: "x" } });
    rejects({ ...minimal, image: { ...full.image, extra: 1 } });
    rejects({ ...minimal, featureImage: { ...full.featureImage, extra: 1 } });
    rejects({ ...full, intro: { ...full.intro, extra: 1 } });
    rejects({ ...full, intro: { ...full.intro, cta: { ...full.intro.cta, extra: 1 } } });
  });

  it("rejects image and featureImage without alt or with empty alt", () => {
    rejects({ ...minimal, image: { src: "./a.jpg" } });
    rejects({ ...minimal, image: { src: "./a.jpg", alt: "" } });
    rejects({ ...minimal, featureImage: { src: "./a.jpg" } });
    rejects({ ...minimal, featureImage: { src: "./a.jpg", alt: "" } });
  });

  it("names the misspelled key in the error", () => {
    const result = schema.safeParse({ ...minimal, titel: "Oops" });
    expect(JSON.stringify(result.error?.issues)).toContain("titel");
  });

  it("row 1: a missing title names title", () => {
    expect(issueText({ description: "x" })).toContain("title");
  });

  it("row 2: a missing description names description", () => {
    expect(issueText({ title: "x" })).toContain("description");
  });

  it("row 3: a wrong type for nav.position names position", () => {
    expect(issueText({ ...minimal, nav: { position: "second" } })).toContain("position");
  });

  it("row 4: a misspelled key is named in the issue text", () => {
    expect(issueText({ ...minimal, titel: "Oops" })).toContain("titel");
  });

  it("row 5: image and featureImage without alt name alt", () => {
    expect(issueText({ ...minimal, image: { src: "./a.jpg" } })).toContain("alt");
    expect(issueText({ ...minimal, featureImage: { src: "./a.jpg" } })).toContain("alt");
  });

  it.each(["photo", "name", "tagline", "bio", "cta"] as const)("rejects intro without %s", (key) => {
    const rest = Object.fromEntries(Object.entries(full.intro).filter(([name]) => name !== key));
    rejects({ ...minimal, intro: rest });
  });

  it("rejects an intro photo without alt and a cta with a bad address", () => {
    rejects({ ...minimal, intro: { ...full.intro, photo: { src: "./a.jpg", alt: "" } } });
    rejects({ ...minimal, intro: { ...full.intro, cta: { label: "Go", href: "services" } } });
    rejects({ ...minimal, intro: { ...full.intro, cta: { label: "", href: "/services/" } } });
  });

  it("rejects a cta address that is protocol-relative (#95)", () => {
    for (const href of ["//example.com/", "/\\example.com/"]) {
      rejects({ ...minimal, intro: { ...full.intro, cta: { label: "Go", href } } });
    }
  });

  it("accepts a cta address that is internal or https (#95)", () => {
    for (const href of ["/", "/services/", "https://example.com/"]) {
      const result = schema.safeParse({ ...minimal, intro: { ...full.intro, cta: { label: "Go", href } } });
      expect(result.success, href).toBe(true);
    }
  });
});
