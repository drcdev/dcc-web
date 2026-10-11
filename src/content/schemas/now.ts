// The `now` collection (specs/040-home-now-start-here/data-model.md; contracts/build-errors.md rows
// N01 to N06, N08, N09). The Now file's front matter holds the date and four one-line topics; its
// body is the "open to" line. Zod comes from Astro's own re-export
// (docs.astro.build/en/reference/modules/astro-zod/).
import { z } from "astro/zod";
import { rawDateProblem } from "../../lib/content/dates.ts";
import { contentError } from "../../lib/content/errors.ts";

/** The topics in the order the section shows them, with the label shown for each. */
export const nowTopics = [
  { key: "workingOn", label: "Working on", hint: "what you are working on now" },
  { key: "reading", label: "Reading", hint: "what you are reading now" },
  { key: "mbaResearch", label: "MBA research", hint: "what your MBA research is about now" },
  { key: "aiExperiments", label: "AI experiments", hint: "the AI experiment you are running now" },
] as const;

const MAX_TOPIC = 200;

function topic(key: string, hint: string) {
  const missing = `add ${key}: ${hint}`;
  return z
    .string({ error: missing })
    .trim()
    .min(1, missing)
    .max(MAX_TOPIC, `${key}: keep it to one line of at most ${MAX_TOPIC} characters`)
    .refine((value) => !/[\r\n]/.test(value), `${key}: keep it to one line of at most ${MAX_TOPIC} characters`);
}

/**
 * The front matter schema. YAML turns an unquoted `2026-10-01` into a Date, so `updated` takes a
 * Date or text and is checked as the day it names. The clock is a parameter so tests can fix it.
 * The output is the day as `YYYY-MM-DD`.
 */
export function nowSchema(clock: () => Date = () => new Date()) {
  const missingDate = "updated: write the date as YYYY-MM-DD";
  const updated = z
    .union([z.date(), z.string()], { error: missingDate })
    .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value))
    .superRefine((value, ctx) => {
      const problem = rawDateProblem(value, clock());
      if (problem) ctx.addIssue({ code: "custom", message: `updated ${problem}` });
    });
  return z.strictObject({
    updated,
    workingOn: topic("workingOn", "what you are working on now"),
    reading: topic("reading", "what you are reading now"),
    mbaResearch: topic("mbaResearch", "what your MBA research is about now"),
    aiExperiments: topic("aiExperiments", "the AI experiment you are running now"),
  });
}

/**
 * Checks the Now body, which the collection schema cannot see: one paragraph with a link to
 * /contact/ (N06, N08). Throws a PageContentError naming the file.
 */
export function checkNowBody(file: string, body: string): void {
  const text = body.trim();
  if (!/\]\(\/contact\/?(?:[#?][^)]*)?\)/.test(text)) {
    throw contentError("now", file, `the body is the "open to" line and must link to /contact/.`);
  }
  if (/^\s{0,3}#{1,6}(?:\s|$)/m.test(text) || /\n\s*\n/.test(text)) {
    throw contentError("now", file, `the "open to" line is one paragraph.`);
  }
}
