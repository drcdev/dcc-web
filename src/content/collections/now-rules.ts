// All of the `now` collection's rules (specs/040-home-now-start-here/data-model.md; contracts/build-errors.md
// rows N01 to N09). The Now file's front matter holds the date and four one-line topics; its body is
// the "open to" line. Beside the schema: the raw-date check, the body check and the "exactly one
// Now file" rule, run by src/lib/now.ts. Zod comes from Astro's own re-export
// (docs.astro.build/en/reference/modules/astro-zod/).
import { z } from "astro/zod";
import { isRealDate, rawDateProblem } from "../../lib/content/dates.ts";
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

// The check on the raw front matter of the Now file that the schema cannot make: Astro's glob
// loader parses front matter with js-yaml, which turns 2026-02-30 into 2 March, so the raw text of
// `updated` is checked as a real YYYY-MM-DD day (contracts/build-errors.md row N02).
/** Throws a PageContentError when `updated` is written in any form other than a real YYYY-MM-DD date. */
export function assertNowDate(file: string, source: string): void {
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1] ?? "";
  const line = /^updated:(.*)$/m.exec(front);
  if (!line) return; // a missing key is the schema's to report (N01)
  const value = (line[1] ?? "").replace(/\s+#.*$/, "").trim();
  if (!isRealDate(value)) {
    throw contentError(
      "now",
      file,
      `updated must be a real date written YYYY-MM-DD with no quotes or time. Found ${value === "" ? "(nothing)" : value}.`,
    );
  }
}

/** Throws a PageContentError unless the Now collection holds exactly one file (N07). */
export function checkNowFiles(count: number): void {
  if (count !== 1) {
    throw contentError("now", "src/content/now/", "there must be exactly one Now file, now.mdx.");
  }
}
