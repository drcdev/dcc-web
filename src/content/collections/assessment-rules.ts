// The `assessments` collection's rules: its schema (specs/037-wayfinder-self-assessment/data-model.md
// section 1; contracts/assessment-data.md rows A1 to A3) and the build-time checks on a post that
// renders it (rows A4 to A10). Strict throughout, so an unknown or misspelled key fails the build,
// and Astro names the file. Zod comes from Astro's own re-export
// (docs.astro.build/en/reference/modules/astro-zod/). Pure; the reader in src/lib/assessment/
// loads the collection and the post route calls the checks.
import { z } from "astro/zod";
import { contentError } from "../../lib/content/errors.ts";

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
  statements: z.array(text).length(3, "Each shift needs exactly three statements."),
});

export const assessmentSchema = z
  .strictObject({
    title: text,
    intro: text,
    scale: z.array(text).length(5, "The scale needs exactly five labels, low to high."),
    shifts: z.array(shift).length(5, "An assessment needs exactly five shifts."),
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

export interface Heading {
  slug: string;
  text: string;
  depth: number;
}

/** The lines of the body that follow the heading with this text, up to the next heading. */
function sectionAfter(lines: readonly string[], heading: Heading): string[] {
  const start = lines.findIndex((line) => {
    const match = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    return match !== null && match[2] === heading.text;
  });
  if (start === -1) return [];
  const end = lines.findIndex((line, i) => i > start && /^#{1,6}\s/.test(line));
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

/**
 * A9: each shift's `**From**:` and `**To**:` lines in the section under its anchor heading equal
 * the data file's `from` and `to`. A shift whose anchor matches no heading is left to the A6 check.
 */
export function checkFromToLines({
  file,
  body,
  headings,
  assessment,
}: {
  file: string;
  body: string;
  headings: readonly Heading[];
  assessment: Assessment;
}): void {
  const lines = body.split("\n");
  for (const shift of assessment.shifts) {
    const heading = headings.find((candidate) => candidate.slug === shift.anchor);
    if (!heading) continue;
    const section = sectionAfter(lines, heading);
    for (const field of ["from", "to"] as const) {
      const label = field === "from" ? "From" : "To";
      const line = section.find((candidate) => candidate.startsWith(`**${label}**:`));
      const written = line?.slice(`**${label}**:`.length).trim() ?? "(no line)";
      if (written !== shift[field]) {
        throw contentError(
          "post",
          file,
          `the **${label}** line of "${shift.name}" says "${written}", but the assessment data file says ${field} is "${shift[field]}". Make them the same.`,
        );
      }
    }
  }
}

/**
 * A10: a Practical Application text that moved to the data file must not stay in the post's prose
 * (FR-004), so the text lives in one place.
 */
export function checkNoMovedText({ file, body, assessment }: { file: string; body: string; assessment: Assessment }): void {
  const stillThere = (text: string) => body.includes(text);
  for (const shift of assessment.shifts) {
    if (stillThere(shift.practicalApplication)) {
      throw contentError(
        "post",
        file,
        `the practicalApplication text of "${shift.name}" is still in the post. Replace it with <PracticalApplication shift="${shift.id}" />.`,
      );
    }
  }
}

/**
 * The assessment ids a post body names: `used` for either component, `withBlock` for
 * those it renders a `SelfAssessment` block for (the A9 check applies to those only).
 */
export function assessmentsNamedIn(body: string): { used: string[]; withBlock: string[] } {
  const ids = (pattern: RegExp) => [...new Set([...body.matchAll(pattern)].map((match) => match[1]!))];
  return {
    used: ids(/<(?:PracticalApplication|SelfAssessment)\b[^>]*\bassessment="([^"]*)"/g),
    withBlock: ids(/<SelfAssessment\b[^>]*\bassessment="([^"]*)"/g),
  };
}

export type Assessments = Readonly<Record<string, Assessment>>;

export function findAssessment(file: string, id: string, known: Assessments): Assessment {
  const found = known[id];
  if (found) return found;
  throw contentError(
    "post",
    file,
    `assessment="${id}" has no data file in src/content/assessments/. The known assessments are: ${Object.keys(known).join(", ") || "none"}.`,
  );
}

export function findShift(file: string, assessment: Assessment, id: string): AssessmentShift {
  const found = assessment.shifts.find((shift) => shift.id === id);
  if (found) return found;
  throw contentError(
    "post",
    file,
    `shift="${id}" is not a shift of this assessment. The known shifts are: ${assessment.shifts.map((shift) => shift.id).join(", ")}.`,
  );
}

/**
 * A6: every shift's `anchor` is the id of a heading the post renders. A7: the post renders the
 * block for an assessment once. Both name the post file; A6 names the shift and the anchor.
 */
export function checkBlockTargets({
  file,
  assessment,
  id,
  headings,
  blockCount,
}: {
  file: string;
  assessment: Assessment;
  id: string;
  headings: readonly { slug: string }[];
  blockCount: number;
}): void {
  if (blockCount > 1) {
    throw contentError("post", file, `the self-assessment "${id}" is rendered ${blockCount} times. Render <SelfAssessment assessment="${id}" /> once.`);
  }
  for (const shift of assessment.shifts) {
    if (!headings.some((heading) => heading.slug === shift.anchor)) {
      throw contentError("post", file, `the anchor "${shift.anchor}" of "${shift.name}" matches no heading in the post. Fix the anchor in the data file or the heading in the post.`);
    }
  }
}

/**
 * The post must carry the `## <title>` heading the block is named by, so the block and the
 * title-card link have a target. `slug` is the id Astro gives that heading (`headingId(title)`).
 */
export function checkBlockHeading({
  file,
  title,
  slug,
  headings,
}: {
  file: string;
  title: string;
  slug: string;
  headings: readonly { slug: string }[];
}): void {
  if (!headings.some((heading) => heading.slug === slug)) {
    throw contentError("post", file, `the self-assessment needs a heading "## ${title}" just above it, so the block and the title-card link have a target.`);
  }
}
