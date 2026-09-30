// The `projects` collection schema (data-model.md "Project", "Demo and StandIn",
// "Comparison", "IndexVisual / Visual"). Called with the `image` helper from the
// collection schema context
// (docs.astro.build/en/guides/images/#images-in-content-collections). Every
// object is strict, so an unknown or misspelled setting fails the build.
import { z } from "astro/zod";
import { themeKey } from "../../lib/content/themes.ts";
import { requiredText as text, type ImageValidator } from "./shared.ts";

const httpsUrl = z.url({ protocol: /^https$/, error: "use an address that starts with https://" });

// FR-042: HTTPS on drc.dev or a subdomain, with no port and no user-info part.
const DRC_DEV = /^https:\/\/([a-z0-9-]+\.)*drc\.dev(\/[^\s]*)?$/;

const idPattern = /^[a-z][a-z0-9-]*$/;
const id = z.string().regex(idPattern, "use lower-case letters, digits and hyphens, starting with a letter");

const problem = text
  .max(140, "keep the problem to 140 characters or fewer")
  .regex(/[.?!]$/, "write the problem as one sentence that ends with . ? or !")
  .refine((value) => !/[.?!]\s+\S/.test(value), "write the problem as one sentence, not several");

const fit = z.enum(["meets", "partly", "misses"]);

const constraint = z.strictObject({ id, label: text, detail: text.optional() });

const option = z.strictObject({
  id,
  name: text,
  summary: text,
  fit: z.record(z.string(), fit),
  pros: z.array(text).optional(),
  cons: z.array(text).optional(),
  chosen: z.boolean().optional(),
  reason: text.optional(),
});

const comparison = z
  .strictObject({
    caption: text.optional(),
    constraints: z.array(constraint).min(1, "list at least one constraint"),
    options: z.array(option).min(1, "list at least one option"),
  })
  .superRefine((value, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    const constraintIds = value.constraints.map((c) => c.id);
    const seenConstraints = new Set<string>();
    value.constraints.forEach((c, index) => {
      if (seenConstraints.has(c.id)) issue(["constraints", index, "id"], `the constraint id ${c.id} is used twice`);
      seenConstraints.add(c.id);
    });
    const seenOptions = new Set<string>();
    value.options.forEach((o, index) => {
      if (seenOptions.has(o.id)) issue(["options", index, "id"], `the option id ${o.id} is used twice`);
      seenOptions.add(o.id);
      for (const cid of constraintIds) {
        if (!(cid in o.fit)) issue(["options", index, "fit"], `add a fit for the constraint ${cid}`);
      }
      for (const key of Object.keys(o.fit)) {
        if (!seenConstraints.has(key)) issue(["options", index, "fit", key], `${key} is not a constraint id`);
      }
      if (!o.chosen && o.reason !== undefined) {
        issue(["options", index, "reason"], "only the chosen option has a reason");
      }
      if (o.chosen && o.reason === undefined) {
        issue(["options", index, "reason"], "the chosen option needs a reason");
      }
    });
    const chosen = value.options.filter((o) => o.chosen).length;
    if (chosen !== 1) issue(["options"], `mark exactly one option as chosen (found ${chosen})`);
  });

/** A visual of the kinds allowed on the index and in the story. */
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
  const clipVisual = z.strictObject({
    kind: z.literal("clip"),
    src: z.string().regex(/\.(webm|mp4)$/i, "use a .webm or .mp4 file"),
    poster: image(),
    label: text,
    description: text,
    placeholder: z.boolean().optional(),
  });
  const visualName = z
    .string()
    .regex(idPattern, "use lower-case letters, digits and hyphens, starting with a letter")
    .refine((name) => name !== "demo", "demo is reserved for the embedded demo");

  return z
    .strictObject({
      title: text,
      problem,
      description: text,
      themes: z.array(text).min(1, "list at least one theme").max(4, "list at most four themes"),
      status: z.enum(["shipped", "experiment", "in-progress"]),
      visual: z.discriminatedUnion("kind", [imageVisual, diagramVisual]),
      order: z.number().int().min(1).optional(),
      date: z.coerce.date().optional(),
      demo: z
        .strictObject({
          href: z.string().regex(DRC_DEV, "use an https:// address on drc.dev, with no port or user name"),
          title: text.optional(),
          embed: z.boolean().default(false),
        })
        .optional(),
      standIn: z.strictObject({ href: httpsUrl, label: text.optional() }).optional(),
      source: httpsUrl.optional(),
      image: z.strictObject({ src: image(), alt: text }).optional(),
      draft: z.boolean().default(false),
      visuals: z.record(visualName, z.discriminatedUnion("kind", [imageVisual, diagramVisual, clipVisual])).optional(),
      comparison,
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
    });
}

export type ProjectData = z.infer<ReturnType<typeof projectSchema>>;
