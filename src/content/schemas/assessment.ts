// The `assessments` collection schema (specs/037-wayfinder-self-assessment/data-model.md
// section 1; contracts/assessment-data.md rows A1 to A3). Strict throughout, so an unknown or
// misspelled key fails the build, and Astro names the file. Zod comes from Astro's own
// re-export (docs.astro.build/en/reference/modules/astro-zod/).
import { z } from "astro/zod";

const text = z.string({ error: "Write this as text." }).trim().min(1, "This text cannot be empty.");
const slug = z
  .string({ error: "Write this as a lower-case id, for example see-the-whole-system." })
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lower-case letters, digits and single hyphens only.");

const shift = z.strictObject({
  id: slug,
  name: text,
  from: text,
  to: text,
  anchor: slug,
  practicalApplication: text,
  week: text,
  statements: z.array(text).length(3, "Each shift needs exactly three statements."),
});

const integrationWeek = z.strictObject({ name: text, week: text });

export const assessmentSchema = z
  .strictObject({
    title: text,
    intro: text,
    scale: z.array(text).length(5, "The scale needs exactly five labels, low to high."),
    shifts: z.array(shift).length(5, "An assessment needs exactly five shifts."),
    integrationWeek,
  })
  .superRefine((value, context) => {
    if (value.scale[0] !== "Rarely" || value.scale[4] !== "Almost always") {
      context.addIssue({
        code: "custom",
        path: ["scale"],
        message: 'The scale must start with "Rarely" and end with "Almost always".',
      });
    }
    if (new Set(value.scale).size !== value.scale.length) {
      context.addIssue({ code: "custom", path: ["scale"], message: "The scale labels must all be different." });
    }
    for (const field of ["id", "anchor"] as const) {
      const seen = new Set<string>();
      for (const item of value.shifts) {
        if (seen.has(item[field])) {
          context.addIssue({
            code: "custom",
            path: ["shifts"],
            message: `Two shifts share the ${field} "${item[field]}". Give each shift its own ${field}.`,
          });
        }
        seen.add(item[field]);
      }
    }
  });

export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentShift = Assessment["shifts"][number];
