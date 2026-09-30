// Zod schemas for the props of each section (data-model.md "Section";
// contracts/sections.md; contracts/build-errors.md rows 11 and 12). A schema
// validates the section's props together with a summary of what is inside it,
// `content`, so "needs text" and "needs exactly one image" are checked the same
// way as a missing prop.
import { z } from "astro/zod";
import type { SectionName } from "./index.ts";

const text = z.string().trim().min(1);
const address = z.string().regex(/^(\/|https:\/\/)/, "use an address that starts with / or https://");

const content = z.strictObject({
  /** Whether there is any text inside the section. */
  text: z.boolean(),
  /** How many Markdown images are inside. */
  images: z.number().int().min(0),
  /** How many `Offering` sections are inside. */
  offerings: z.number().int().min(0),
});
type Content = z.infer<typeof content>;

function section<Shape extends z.ZodRawShape>(
  props: Shape,
  check: (content: Content, ctx: z.RefinementCtx) => void = () => {},
) {
  return z.strictObject({ ...props, content }).superRefine((value, ctx) => check((value as { content: Content }).content, ctx));
}

const needsText = (what: string) => (value: Content, ctx: z.RefinementCtx) => {
  if (!value.text) ctx.addIssue({ code: "custom", path: ["content"], message: `needs ${what} inside it` });
};

const needsOneImage = (value: Content, ctx: z.RefinementCtx) => {
  if (value.images !== 1) {
    ctx.addIssue({
      code: "custom",
      path: ["content"],
      message: "needs exactly one image inside it, written as ![alt text](./images/file.jpg)",
    });
  }
};

export const sectionSchemas = {
  Lead: section({}, needsText("text")),
  TextBlock: section({ title: text }, needsText("text")),
  Offerings: section({ title: text.optional() }, (value, ctx) => {
    if (value.offerings < 1) ctx.addIssue({ code: "custom", path: ["content"], message: "needs at least one Offering" });
  }),
  Offering: section({ title: text, href: address.optional() }, needsText("a short description")),
  CallToAction: section({ label: text, href: address }),
  Figure: section({ caption: text.optional() }, needsOneImage),
  WideImage: section({ caption: text.optional() }, needsOneImage),
  FullImage: section({ caption: text.optional() }, needsOneImage),
  ContactForm: section({}),
} satisfies Record<SectionName, z.ZodType>;
