// Schema pieces shared by the page collection (data-model.md "Page"). Every
// object is strict, so an unknown or misspelled key fails the build (FR-007).
// Zod comes from Astro's own re-export
// (docs.astro.build/en/reference/modules/astro-zod/).
import { z } from "astro/zod";

/** The `image()` helper from the collection schema context, or any stand-in with the same shape. */
export type ImageValidator = () => z.ZodType;

const text = z.string().trim().min(1);

/** An image reference with required alt text (FR-004). */
export function imageWithAlt(image: ImageValidator) {
  return z.strictObject({ src: image(), alt: text });
}

/** An image with alt text and an optional caption (`featureImage`). */
export function captionedImage(image: ImageValidator) {
  return z.strictObject({ src: image(), alt: text, caption: text.optional() });
}

/** The two settings every page needs (FR-005). Length is guidance only. */
export const seoFields = {
  title: text,
  description: text,
};

/** `nav`: present means the page is listed in the header navigation (FR-008). */
export const navField = z.strictObject({
  position: z.number().int().min(1),
  label: text.optional(),
});

/** A link target: an internal address or an https:// address. */
export const linkTarget = z.string().regex(/^(\/|https:\/\/)/, "use an address that starts with / or https://");

export { text as requiredText };
