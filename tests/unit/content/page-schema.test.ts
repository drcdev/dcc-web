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

  it.each(["photo", "name", "tagline", "bio", "cta"] as const)("rejects intro without %s", (key) => {
    const rest = Object.fromEntries(Object.entries(full.intro).filter(([name]) => name !== key));
    rejects({ ...minimal, intro: rest });
  });

  it("rejects an intro photo without alt and a cta with a bad address", () => {
    rejects({ ...minimal, intro: { ...full.intro, photo: { src: "./a.jpg", alt: "" } } });
    rejects({ ...minimal, intro: { ...full.intro, cta: { label: "Go", href: "services" } } });
    rejects({ ...minimal, intro: { ...full.intro, cta: { label: "", href: "/services/" } } });
  });
});
