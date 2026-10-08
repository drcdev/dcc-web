// The `pages` collection schema (data-model.md "Page" and "HomeIntro"). Called
// with the `image` helper from the collection schema context
// (docs.astro.build/en/guides/images/#images-in-content-collections).
import { z } from "astro/zod";
import { captionedImage, imageWithAlt, linkTarget, navField, requiredText, seoFields, type ImageValidator } from "./shared.ts";

export function pageSchema({ image }: { image: ImageValidator }) {
  return z.strictObject({
    ...seoFields,
    image: imageWithAlt(image).optional(),
    featureImage: captionedImage(image).optional(),
    nav: navField.optional(),
    visible: z.boolean().default(true),
    draft: z.boolean().default(false),
    intro: z
      .strictObject({
        photo: imageWithAlt(image),
        name: requiredText,
        tagline: requiredText,
        bio: requiredText,
        cta: z.strictObject({ label: requiredText, href: linkTarget }),
      })
      .optional(),
  });
}

/**
 * A landing file (`writing.mdx`, `projects.mdx`): only the title and a header menu entry. The
 * address, heading and lists come from the code route (contracts/page-settings.md).
 */
export const landingSchema = z.strictObject({
  title: requiredText,
  nav: navField.extend({ location: z.literal("header") }),
});

export type PageData = z.infer<ReturnType<typeof pageSchema>>;
