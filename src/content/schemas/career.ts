// The `career` collection (specs/041-career-timeline/data-model.md; contracts/build-errors.md rows
// T01 to T07 and T12). One YAML file per career step. Every object is strict, so an unknown key
// (including a fourth category) fails the build. Posts are references
// (docs.astro.build/en/guides/content-collections/#defining-collection-references); the rules that
// span files (C1 to C4) run when the About page builds. Zod comes from Astro's own re-export.
import { reference } from "astro:content";
import { z } from "astro/zod";

const SHORT = 120;
const LONG = 300;
const ITEM = 200;

const monthMessage = (field: string, extra = "") => `${field}: write the month as YYYY-MM${extra}`;
const month = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Trimmed, non-empty plain text of at most `limit` characters. */
const text = (field: string, limit: number) =>
  z.string().trim().min(1, `${field}: write some text, or leave the key out`).max(limit, `${field}: keep this under ${limit} characters`);

const list = <T extends z.ZodType>(field: string, item: T) =>
  z.array(item).min(1, `${field}: list at least one item, or leave the key out`);

export function careerSchema() {
  return z
    .strictObject({
      role: z.string().trim().min(1, "role: write the role").max(SHORT, `role: keep this under ${SHORT} characters`),
      organization: z
        .string()
        .trim()
        .min(1, "organization: write the organization")
        .max(SHORT, `organization: keep this under ${SHORT} characters`),
      start: z.string().regex(month, monthMessage("start")),
      end: z
        .string()
        .refine((value) => value === "present" || month.test(value), monthMessage("end", " or present")),
      scope: z.string().trim().min(1, "scope: write what the role covered").max(LONG, `scope: keep this under ${LONG} characters`),
      decision: text("decision", LONG).optional(),
      changed: text("changed", LONG).optional(),
      wish: text("wish", LONG).optional(),
      nextMove: text("nextMove", LONG).optional(),
      achievements: list("achievements", z.string().trim().min(1, "write some text").max(ITEM, `keep this under ${ITEM} characters`)).optional(),
      leadership: list("leadership", z.string().trim().min(1, "write some text").max(ITEM, `keep this under ${ITEM} characters`)).optional(),
      awards: list(
        "awards",
        z.strictObject({
          name: z.string().trim().min(1, "write the award name").max(ITEM, `keep this under ${ITEM} characters`),
          year: z.number({ error: "write the year as a whole number" }).int("write the year as a whole number"),
          href: z
            .url({ error: "write a full https address" })
            .refine((value) => value.startsWith("https://"), "the address must start with https://")
            .optional(),
        }),
      ).optional(),
      posts: list("posts", reference("posts")).optional(),
    })
    .superRefine((step, ctx) => {
      if (step.end !== "present" && month.test(step.start) && step.end < step.start) {
        ctx.addIssue({ code: "custom", path: ["end"], message: "end: the end month is before the start month" });
      }
      const seen = new Set<string>();
      for (const post of step.posts ?? []) {
        const slug = typeof post === "string" ? post : post.id;
        if (seen.has(slug)) ctx.addIssue({ code: "custom", path: ["posts"], message: `posts: ${slug} is listed twice` });
        seen.add(slug);
      }
    });
}
