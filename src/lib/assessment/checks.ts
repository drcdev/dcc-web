// Checks on a post that renders the self-assessment (contracts/assessment-data.md rows A9 and A10).
// Pure; the post route calls them with the post's raw body and its rendered headings.
import type { Assessment } from "../../content/schemas/assessment.ts";
import { contentError } from "../content/errors.ts";

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
