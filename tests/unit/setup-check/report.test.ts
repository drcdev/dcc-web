import { describe, expect, it } from "vitest";
import { buildReport, collectSecretValues, formatHumanReport, formatJsonReport } from "../../../scripts/setup-check/report.ts";
import { checkReportSchema } from "../../../scripts/setup-check/schemas.ts";
import type { CheckResult, SetupItem } from "../../../scripts/setup-check/types.ts";

function item(id: string, order: number, needsDon = true): SetupItem {
  return {
    id,
    order,
    title: `Title for ${id}`,
    purpose: "purpose",
    where: "where",
    confirmedBy: "confirmedBy",
    needsDon,
    principles: ["II"],
    requirements: ["FR-001"],
    secrets: [],
    dependsOn: [],
    phase: "before-merge",
    check: async () => complete(id, order),
  };
}

function complete(id: string, order: number): CheckResult {
  return {
    id,
    status: "complete",
    summary: `${id} is complete.`,
    details: [],
    nextAction: null,
    step: `Step ${order} of 18`,
    docs: `docs/setup.md#${id}`,
    reason: null,
  };
}

function missing(id: string, order: number): CheckResult {
  return {
    id,
    status: "missing",
    summary: `${id} is missing.`,
    details: ["a detail"],
    nextAction: `Do something for ${id}.`,
    step: `Step ${order} of 18`,
    docs: `docs/setup.md#${id}`,
    reason: null,
  };
}

function pendingResult(id: string, order: number): CheckResult {
  return {
    id,
    status: "pending",
    summary: `${id} is pending.`,
    details: [],
    nextAction: "Nothing to do now; propagation can take up to 24 hours. Run the check again later.",
    step: `Step ${order} of 18`,
    docs: `docs/setup.md#${id}`,
    reason: null,
  };
}

function couldNotCheckResult(id: string, order: number, reason: string): CheckResult {
  return {
    id,
    status: "could-not-check",
    summary: `Could not check ${id}.`,
    details: [],
    nextAction: `Fix access for ${id}.`,
    step: `Step ${order} of 18`,
    docs: `docs/setup.md#${id}`,
    reason,
  };
}

function fullRegistry(): SetupItem[] {
  return Array.from({ length: 18 }, (_, i) => item(`item-${i + 1}`, i + 1));
}

describe("setup-check/report", () => {
  it("summary line states N of total complete", () => {
    const items = fullRegistry();
    const results = items.map((i, idx) => (idx < 6 ? complete(i.id, i.order) : missing(i.id, i.order)));
    const report = buildReport(results, items, { generatedAt: "2026-09-28T14:05:00.000Z" });

    expect(report.counts.total).toBe(18);
    expect(report.counts.complete).toBe(6);

    const human = formatHumanReport(report);
    expect(human).toContain("6 of 18 complete");
  });

  it("ok is true only when counts.complete === counts.total", () => {
    const items = fullRegistry();
    const allComplete = buildReport(
      items.map((i) => complete(i.id, i.order)),
      items,
    );
    expect(allComplete.ok).toBe(true);

    const oneMissing = buildReport(
      [...items.slice(0, 17).map((i) => complete(i.id, i.order)), missing(items[17]!.id, items[17]!.order)],
      items,
    );
    expect(oneMissing.ok).toBe(false);
  });

  it("every non-complete result validates against the report schema (nextAction and reason requirements)", () => {
    const items = [item("a", 1), item("b", 2), item("c", 3)];
    const report = buildReport(
      [missing("a", 1), pendingResult("b", 2), couldNotCheckResult("c", 3, "no credentials")],
      items,
    );

    const parsed = checkReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });

  it("prints each status as its word(s) beside the symbol, never colour alone", () => {
    const items = [item("a", 1), item("b", 2), item("c", 3), item("d", 4)];
    const report = buildReport(
      [complete("a", 1), missing("b", 2), pendingResult("c", 3), couldNotCheckResult("d", 4, "no credentials")],
      items,
    );

    const human = formatHumanReport(report, { color: false });
    expect(human).toMatch(/complete/);
    expect(human).toMatch(/missing/);
    expect(human).toMatch(/pending/);
    expect(human).toMatch(/could not check/);
  });

  it("prints a Reason: line for could-not-check and a Next: line for every non-complete item", () => {
    const items = [item("a", 1)];
    const report = buildReport([couldNotCheckResult("a", 1, "CLOUDFLARE_API_TOKEN is not set in .env.")], items);

    const human = formatHumanReport(report);
    expect(human).toMatch(/^\s*Reason: CLOUDFLARE_API_TOKEN is not set in \.env\.$/m);
    expect(human).toMatch(/^\s*Next: Fix access for a\.$/m);
  });

  it("emits no ANSI colour codes when color is false", () => {
    const items = fullRegistry();
    const report = buildReport(
      items.map((i) => complete(i.id, i.order)),
      items,
    );

    const human = formatHumanReport(report, { color: false });
    expect(human.includes("\u001b[")).toBe(false);
  });

  it("emits no box-drawing characters", () => {
    const items = fullRegistry();
    const report = buildReport(
      items.map((i) => complete(i.id, i.order)),
      items,
    );

    const human = formatHumanReport(report);
    expect(human).not.toMatch(/[─-╿]/);
  });

  it("keeps each result's summary on a single line (one sentence, no embedded newline)", () => {
    const items = [item("a", 1)];
    const report = buildReport([missing("a", 1)], items);

    for (const entry of report.results) {
      expect(entry.summary).not.toContain("\n");
    }
  });

  it("a pending next action states what is awaited, the wait, and that no action is needed now", () => {
    const items = [item("a", 1)];
    const report = buildReport([pendingResult("a", 1)], items);

    expect(report.results[0]!.nextAction).toMatch(/nothing to do/i);
    expect(report.results[0]!.nextAction).toMatch(/hour|later|wait/i);
  });

  it("formats step as 'Step N of 18' and docs as 'docs/setup.md#<id>'", () => {
    const items = [item("dns-records-parity", 4)];
    const report = buildReport([complete("dns-records-parity", 4)], items);

    expect(report.results[0]!.step).toBe("Step 4 of 18");
    expect(report.results[0]!.docs).toBe("docs/setup.md#dns-records-parity");
  });

  it("redacts a canary secret value from both the human and JSON output, keeping the secret's name", () => {
    const items = [item("cloudflare-worker", 7)];
    const canaryValue = "canary-secret-value-should-never-appear-1234567890";
    const result = couldNotCheckResult(
      "cloudflare-worker",
      7,
      `CLOUDFLARE_API_TOKEN=${canaryValue} was rejected by Cloudflare`,
    );

    const report = buildReport([result], items, { secretValues: [canaryValue] });

    const human = formatHumanReport(report);
    const json = formatJsonReport(report);

    expect(human).not.toContain(canaryValue);
    expect(json).not.toContain(canaryValue);
    expect(human).toContain("[redacted]");
    expect(json).toContain("[redacted]");
    expect(human).toContain("CLOUDFLARE_API_TOKEN");
    expect(json).toContain("CLOUDFLARE_API_TOKEN");
  });

  it("collectSecretValues reads every manifest secret's current value from the env reader", () => {
    const env = {
      get: (name: string) => (name === "CLOUDFLARE_API_TOKEN" ? "value-1" : undefined),
      has: () => false,
    };

    const values = collectSecretValues(env);

    expect(values).toContain("value-1");
    expect(values).not.toContain(undefined);
  });

  it("an incomplete deferred-until-merge item is reported as after merge and does not fail the check (FR-028a)", () => {
    const items = [item("a", 1), { ...item("z", 2), phase: "after-merge" as const, deferredUntilMerge: true }];
    const report = buildReport([complete("a", 1), missing("z", 2)], items);
    expect(report.ok).toBe(true);
    const human = formatHumanReport(report);
    expect(human).toMatch(/after merge/i);
    expect(checkReportSchema.safeParse(report).success).toBe(true);
  });

  it("an incomplete before-merge item still fails the check even when a deferred item is complete", () => {
    const items = [item("a", 1), { ...item("z", 2), phase: "after-merge" as const, deferredUntilMerge: true }];
    const report = buildReport([missing("a", 1), complete("z", 2)], items);
    expect(report.ok).toBe(false);
  });

  it("redacts a Worker secret value that leaked into any text field of a contact item", () => {
    const leaked = "tsk_leaked_secret_value_1234567890";
    const items = [item("contact-worker-secrets", 21)];
    const bad = { ...missing("contact-worker-secrets", 21), summary: `Found ${leaked}`, details: [leaked] };
    const report = buildReport([bad], items, { secretValues: [leaked] });
    expect(formatJsonReport(report)).not.toContain(leaked);
    expect(formatHumanReport(report)).not.toContain(leaked);
  });
});
