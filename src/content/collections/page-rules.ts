// The `pages` collection rules: the schema (data-model.md "Page" and "HomeIntro") and the check a
// schema cannot express (contracts/page-settings.md row V5; FR-010). The schema is called with the
// `image` helper from the collection schema context
// (docs.astro.build/en/guides/images/#images-in-content-collections). The check runs in the
// loader's `generateId`, so the build stops before any page is rendered and the error names the file.
import { z } from "astro/zod";
import { captionedImage, imageWithAlt, linkTarget, navField, requiredText, seoFields, type ImageValidator } from "../../lib/content/schema-fields.ts";
import { contentError } from "../../lib/content/errors.ts";

// One shared definition for the introduction card's two buttons (data-model.md "CallToAction").
const callToAction = z.strictObject({ label: requiredText, href: linkTarget });

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
        cta: callToAction,
        secondaryCta: callToAction.optional(),
      })
      .optional(),
  });
}

export type PageData = z.infer<ReturnType<typeof pageSchema>>;

const PAGES_DIR = "src/content/pages";

/** The home page may be a draft, but it must always be visible: it is the site's front door (V5). */
export function assertHomeVisible(id: string, entry: string, data: { visible?: unknown; draft?: unknown }): void {
  if (id === "index" && data.visible === false) {
    throw contentError(
      "page",
      `${PAGES_DIR}/${entry}`,
      "the home page cannot have visible: false. Remove the setting, or use draft: true to keep it off the index.",
    );
  }
}
