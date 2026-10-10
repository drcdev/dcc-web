// astro/zod schemas for setup/*.json and the `pnpm setup:check --json` report
// shape (Principle IV: no separate Zod dependency — this re-exports Astro's).
import { z } from "astro/zod";

// Lowercase DNS label: letters/digits, dashes allowed in the middle only.
// Public (it appears in every preview URL) — never a secret (002-site-foundation
// research R2, contracts/site-origin.md).
const dnsLabelSchema = z.string().regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/);

export const configSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  machineAccount: z.string().min(1),
  workerName: z.string().min(1),
  previewWorkerName: z.string().min(1).optional(),
  zone: z.string().min(1),
  workersSubdomain: dnsLabelSchema.optional(),
});

const dnsRecordTypeSchema = z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "CAA", "NS"]);

const dnsBaselineRecordSchema = z
  .object({
    type: dnsRecordTypeSchema,
    name: z.string().min(1),
    content: z.string().min(1),
    priority: z.number().int().nullable(),
    ttl: z.number().int().positive(),
  })
  .strict()
  .check((ctx) => {
    const record = ctx.value;
    if ((record.type === "MX" || record.type === "SRV") && record.priority === null) {
      ctx.issues.push({
        code: "custom",
        message: `${record.type} record "${record.name}" must have a priority`,
        input: record,
        path: ["priority"],
      });
    }
  });

// The must-exist list: every record here has to be in the Cloudflare zone.
export const dnsBaselineSchema = z
  .object({
    records: z.array(dnsBaselineRecordSchema),
  })
  .strict();

// setup/github-ruleset.json: the body imported as a GitHub repository ruleset
// (research R9). Only the fields this slice's drift and setup checks rely on
// are validated strictly; GitHub's own API validates the rest on import.
const rulesetRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("deletion") }),
  z.object({ type: z.literal("non_fast_forward") }),
  z.object({
    type: z.literal("pull_request"),
    parameters: z.object({
      required_approving_review_count: z.number().int().min(0),
      require_code_owner_review: z.boolean(),
      dismiss_stale_reviews_on_push: z.boolean(),
      required_review_thread_resolution: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal("required_status_checks"),
    parameters: z.object({
      strict_required_status_checks_policy: z.boolean(),
      required_status_checks: z
        .array(z.object({ context: z.string().min(1), integration_id: z.number().int().positive().optional() }))
        .min(1),
    }),
  }),
]);

export const githubRulesetSchema = z.object({
  name: z.string().min(1),
  target: z.literal("branch"),
  enforcement: z.enum(["active", "disabled", "evaluate"]),
  conditions: z.object({
    ref_name: z.object({
      include: z.array(z.string().min(1)).min(1),
      exclude: z.array(z.string()),
    }),
  }),
  rules: z.array(rulesetRuleSchema).min(1),
  bypass_actors: z.array(z.unknown()),
});

// contracts/check-report.schema.json, mirrored as a zod schema.
const checkStatusSchema = z.enum(["complete", "missing", "pending", "could-not-check", "waiting"]);

const checkReportResultSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: z.string().min(1),
    status: checkStatusSchema,
    summary: z.string(),
    details: z.array(z.string()),
    nextAction: z.string().nullable(),
    step: z.string().regex(/^Step [0-9]+ of [0-9]+$/),
    docs: z.string().regex(/^docs\/setup\.md#[a-z0-9-]+$/),
    reason: z.string().nullable(),
    needsDon: z.boolean(),
  })
  .check((ctx) => {
    const result = ctx.value;
    if (result.status !== "complete" && (!result.nextAction || result.nextAction.length === 0)) {
      ctx.issues.push({
        code: "custom",
        message: `"${result.id}" is not complete and must have a nextAction`,
        input: result,
        path: ["nextAction"],
      });
    }
    if (result.status === "could-not-check" && (!result.reason || result.reason.length === 0)) {
      ctx.issues.push({
        code: "custom",
        message: `"${result.id}" is could-not-check and must have a reason`,
        input: result,
        path: ["reason"],
      });
    }
  });

export const checkReportSchema = z.object({
  generatedAt: z.iso.datetime({ offset: true }).or(z.iso.datetime()),
  ok: z.boolean(),
  counts: z.object({
    complete: z.number().int().min(0),
    missing: z.number().int().min(0),
    pending: z.number().int().min(0),
    couldNotCheck: z.number().int().min(0),
    waiting: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  results: z.array(checkReportResultSchema),
});

export type ParsedConfig = z.infer<typeof configSchema>;
export type ParsedDnsBaseline = z.infer<typeof dnsBaselineSchema>;
export type ParsedGithubRuleset = z.infer<typeof githubRulesetSchema>;
export type ParsedCheckReport = z.infer<typeof checkReportSchema>;

/** Parses and validates JSON text, throwing a clear, single-line error on failure. */
export function parseWithSchema<T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: { message: string } } },
  input: unknown,
  label: string,
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`${label} is invalid: ${result.error?.message}`);
  }
  return result.data as T;
}
