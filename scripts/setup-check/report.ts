// The setup check's report builder and formatters (data-model.md
// "CheckReport", contracts/setup-check-cli.md, contracts/check-report.schema.json).
// `buildReport` joins each check's raw CheckResult with its registry entry
// (title, needsDon) and applies a final redaction pass over every text field,
// so a secret value that somehow leaked into a summary, detail, next action
// or reason is still replaced with "[redacted]" before anything is printed
// (FR-005, FR-024, FR-030 — defence in depth on top of each check's own and
// each provider's own redaction).
import { redact } from "./redact.ts";
import { secretManifest } from "./secrets.ts";
import type { CheckReport, CheckReportCounts, CheckResult, EnvReader, ReportResultEntry, SetupItem } from "./types.ts";

const STATUS_SYMBOL: Record<CheckResult["status"], string> = {
  complete: "[x]",
  missing: "[!]",
  pending: "[~]",
  "could-not-check": "[?]",
};

const STATUS_WORD: Record<CheckResult["status"], string> = {
  complete: "complete",
  missing: "missing",
  pending: "pending",
  "could-not-check": "could not check",
};

const STATUS_ANSI: Record<CheckResult["status"], string> = {
  complete: "\u001b[32m", // green
  missing: "\u001b[31m", // red
  pending: "\u001b[33m", // yellow
  "could-not-check": "\u001b[36m", // cyan
};
const ANSI_RESET = "\u001b[0m";

/** Every secret value currently readable from `.env`, used only to redact — never logged or returned otherwise. */
export function collectSecretValues(env: EnvReader): string[] {
  return secretManifest
    .map((s) => env.get(s.name))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

function redactText(text: string, secretValues: string[]): string {
  return redact(text, secretValues);
}

function redactResult(result: CheckResult, secretValues: string[]): CheckResult {
  return {
    ...result,
    summary: redactText(result.summary, secretValues),
    details: result.details.map((d) => redactText(d, secretValues)),
    nextAction: result.nextAction ? redactText(result.nextAction, secretValues) : null,
    reason: result.reason ? redactText(result.reason, secretValues) : null,
  };
}

export interface BuildReportOptions {
  /** Known secret values to redact from every text field (defence in depth). */
  secretValues?: string[];
  /** Overrides `new Date().toISOString()`, for deterministic tests. */
  generatedAt?: string;
}

export function buildReport(results: CheckResult[], items: SetupItem[], options: BuildReportOptions = {}): CheckReport {
  const secretValues = options.secretValues ?? [];
  const entries: ReportResultEntry[] = results.map((result) => {
    const item = items.find((i) => i.id === result.id);
    const redacted = redactResult(result, secretValues);
    const afterMergeNote =
      item?.deferredUntilMerge && result.status !== "complete" ? "After merge (does not fail the check before the merge): " : "";
    return {
      ...redacted,
      summary: `${afterMergeNote}${redacted.summary}`,
      title: item?.title ?? result.id,
      needsDon: item?.needsDon ?? false,
    };
  });

  const counts: CheckReportCounts = {
    complete: entries.filter((e) => e.status === "complete").length,
    missing: entries.filter((e) => e.status === "missing").length,
    pending: entries.filter((e) => e.status === "pending").length,
    couldNotCheck: entries.filter((e) => e.status === "could-not-check").length,
    total: entries.length,
  };

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    // A deferred-until-merge item (FR-028a) is reported but does not fail the check before the merge.
    ok: entries.every(
      (e) => e.status === "complete" || items.find((i) => i.id === e.id)?.deferredUntilMerge === true,
    ),
    counts,
    results: entries,
  };
}

export interface FormatHumanOptions {
  /** Whether to emit ANSI colour codes. Callers pass `process.stdout.isTTY && !process.env.NO_COLOR`. */
  color?: boolean;
}

function colorizeStatus(status: CheckResult["status"], text: string, color: boolean): string {
  if (!color) return text;
  return `${STATUS_ANSI[status]}${text}${ANSI_RESET}`;
}

/** Human report per contracts/setup-check-cli.md. Every status is printed as its word(s) beside the symbol, never by symbol or colour alone. */
export function formatHumanReport(report: CheckReport, options: FormatHumanOptions = {}): string {
  const color = options.color ?? false;
  const generated = report.generatedAt.replace("T", " ").replace(/\.\d+Z?$/, "").replace(/Z$/, "");
  const lines: string[] = [`Setup check — doncoleman.ca                      ${generated}`, ""];

  for (const entry of report.results) {
    const label = colorizeStatus(entry.status, `${STATUS_SYMBOL[entry.status]} ${STATUS_WORD[entry.status]}`, color);
    lines.push(`  ${label}  ${entry.step}  ${entry.title}`);
    if (entry.summary) {
      lines.push(`      ${entry.summary}`);
    }
    for (const detail of entry.details) {
      lines.push(`        ${detail}`);
    }
    if (entry.status === "could-not-check" && entry.reason) {
      lines.push(`      Reason: ${entry.reason}`);
    }
    if (entry.nextAction) {
      lines.push(`      Next: ${entry.nextAction}`);
    }
    lines.push(`      See ${entry.docs}`);
    lines.push("");
  }

  lines.push(
    `  ${report.counts.complete} of ${report.counts.total} complete · ${report.counts.missing} missing · ` +
      `${report.counts.pending} pending · ${report.counts.couldNotCheck} could not check`,
  );

  return lines.join("\n");
}

/** `--json` report per contracts/check-report.schema.json: one JSON document, nothing else on stdout. */
export function formatJsonReport(report: CheckReport): string {
  return JSON.stringify(report);
}
