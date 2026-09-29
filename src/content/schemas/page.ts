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

export type PageData = z.infer<ReturnType<typeof pageSchema>>;
