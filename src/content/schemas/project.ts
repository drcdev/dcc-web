// The `projects` collection schema (specs/014-project-four-part-story/data-model.md "Project",
// "PartPicture"). Called with the `image` helper from the collection schema context
// (docs.astro.build/en/guides/images/#images-in-content-collections). Every
// object is strict, so an unknown, misspelled or removed setting fails the build naming it.
import { z } from "astro/zod";
import { partIds } from "../../lib/content/parts.ts";
import { themeKey } from "../../lib/content/themes.ts";
import { requiredText as text, type ImageValidator } from "./shared.ts";

const httpsUrl = z.url({ protocol: /^https$/, error: "use an address that starts with https://" });

// FR-042: HTTPS on drc.dev or a subdomain, with no port and no user-info part.
const DRC_DEV = /^https:\/\/([a-z0-9-]+\.)*drc\.dev(\/[^\s]*)?$/;

const idPattern = /^[a-z][a-z0-9-]*$/;

const problem = text
  .max(140, "write the problem as one sentence of at most 140 characters")
  .regex(/[.?!]$/, "write the problem as one sentence of at most 140 characters that ends with . ? or !")
  .refine((value) => !/[.?!]\s+\S/.test(value), "write the problem as one sentence of at most 140 characters, not several sentences");

const part = z.enum(partIds, { error: `part must be one of ${partIds.join(", ")}` });

/** A picture of the kinds allowed on the list and in the story. */
function pictureVisuals(image: ImageValidator) {
  return [
    z.strictObject({
      kind: z.literal("image"),
      src: image(),
      alt: text,
      placeholder: z.boolean().optional(),
    }),
    z.strictObject({
      kind: z.literal("diagram"),
      src: image(),
      alt: text,
      description: text,
      placeholder: z.boolean().optional(),
    }),
  ] as const;
}

export function projectSchema({ image }: { image: ImageValidator }) {
  const [imageVisual, diagramVisual] = pictureVisuals(image);
  // A picture in the story also says which part it sits beside (optional: none means kept but not shown).
  const storyImage = imageVisual.extend({ part: part.optional() });
  const storyDiagram = diagramVisual.extend({ part: part.optional() });
  const visualName = z
    .string()
    .regex(idPattern, "use lower-case letters, digits and hyphens, starting with a letter");

  return z
    .strictObject({
      title: text,
      problem,
      description: text,
      themes: z.array(text).min(1, "list at least one theme").max(4, "list at most four themes"),
      status: z.enum(["shipped", "experiment", "in-progress"]),
      date: z.coerce.date(),
      visual: z.discriminatedUnion("kind", [imageVisual, diagramVisual]),
      visuals: z.record(visualName, z.discriminatedUnion("kind", [storyImage, storyDiagram])).optional(),
      demo: z
        .strictObject({
          href: z.string().regex(DRC_DEV, "use an https:// address on drc.dev, with no port or user name"),
          title: text.optional(),
        })
        .optional(),
      standIn: z.strictObject({ href: httpsUrl, label: text.optional() }).optional(),
      source: httpsUrl.optional(),
      image: z.strictObject({ src: image(), alt: text }).optional(),
      // Trimmed; empty text means the standard sentence (no value).
      invitation: z
        .string()
        .trim()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),
      draft: z.boolean().default(false),
    })
    .superRefine((value, ctx) => {
      if (value.demo && value.standIn) {
        ctx.addIssue({ code: "custom", path: ["standIn"], message: "use demo or standIn, not both" });
      }
      const seen = new Set<string>();
      value.themes.forEach((theme, index) => {
        const key = themeKey(theme);
        if (seen.has(key)) ctx.addIssue({ code: "custom", path: ["themes", index], message: `${theme} repeats a theme` });
        seen.add(key);
      });
      const byPart = new Map<string, string>();
      for (const [name, picture] of Object.entries(value.visuals ?? {})) {
        if (!picture.part) continue;
        const first = byPart.get(picture.part);
        if (first === undefined) {
          byPart.set(picture.part, name);
          continue;
        }
        ctx.addIssue({
          code: "custom",
          path: ["visuals", name, "part"],
          message: `the pictures ${first} and ${name} both use the part ${picture.part}; give each part at most one picture`,
        });
      }
    });
}

export type ProjectData = z.infer<ReturnType<typeof projectSchema>>;
