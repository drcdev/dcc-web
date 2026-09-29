import { describe, expect, it } from "vitest";
import {
  checkReportSchema,
  configSchema,
  dnsBaselineSchema,
  githubRulesetSchema,
} from "../../../scripts/setup-check/schemas.ts";

function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

describe("configSchema (setup/config.json)", () => {
  const valid = {
    owner: "drcdev",
    repo: "dcc-web",
    machineAccount: "drc-agents",
    workerName: "dcc-web",
    zone: "doncoleman.ca",
    reviewHost: "new.doncoleman.ca",
    ghostMarker: "Ghost",
  };

  it("accepts a valid config", () => {
    const result = configSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a config missing a required field", () => {
    const result = configSchema.safeParse(omit(valid, "zone"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });

  it("rejects a config with an empty-string field", () => {
    const result = configSchema.safeParse({ ...valid, owner: "" });
    expect(result.success).toBe(false);
  });
});

describe("dnsBaselineSchema (setup/dns-baseline.json)", () => {
  const validRecord = {
    type: "A",
    name: "doncoleman.ca",
    content: "192.0.2.1",
    priority: null,
    ttl: 3600,
    source: "squarespace",
    decision: "keep",
    reason: null,
  };

  it("accepts an empty baseline", () => {
    const result = dnsBaselineSchema.safeParse({ originalNameservers: [], records: [] });
    expect(result.success).toBe(true);
  });

  it("accepts a valid populated baseline", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: ["ns1.squarespace.com", "ns2.squarespace.com"],
      records: [validRecord],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a record missing a required field", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: [],
      records: [omit(validRecord, "ttl")],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an MX record without a priority", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: [],
      records: [{ ...validRecord, type: "MX", content: "mx1.example.net", priority: null }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an MX record with a priority", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: [],
      records: [{ ...validRecord, type: "MX", content: "mx1.example.net", priority: 10 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a dropped record with no reason", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: [],
      records: [{ ...validRecord, decision: "drop", reason: null }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a dropped record with a reason", () => {
    const result = dnsBaselineSchema.safeParse({
      originalNameservers: [],
      records: [{ ...validRecord, decision: "drop", reason: "unused legacy verification record" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("githubRulesetSchema (setup/github-ruleset.json)", () => {
  const valid = {
    name: "main-protection",
    target: "branch",
    enforcement: "active",
    conditions: { ref_name: { include: ["refs/heads/main"], exclude: [] } },
    rules: [
      { type: "deletion" },
      { type: "non_fast_forward" },
      {
        type: "pull_request",
        parameters: {
          required_approving_review_count: 0,
          require_code_owner_review: true,
          dismiss_stale_reviews_on_push: true,
          required_review_thread_resolution: false,
        },
      },
      {
        type: "required_status_checks",
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [{ context: "verify" }, { context: "major-change-approval" }],
        },
      },
    ],
    bypass_actors: [],
  };

  it("accepts a valid ruleset", () => {
    const result = githubRulesetSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a ruleset missing rules", () => {
    const result = githubRulesetSchema.safeParse(omit(valid, "rules"));
    expect(result.success).toBe(false);
  });

  it("rejects a ruleset with an unknown rule type", () => {
    const result = githubRulesetSchema.safeParse({
      ...valid,
      rules: [...valid.rules, { type: "not-a-real-rule" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("checkReportSchema (--json report shape)", () => {
  const validResult = {
    id: "local-tools",
    title: "Local tools",
    status: "complete",
    summary: "Node 24 and pnpm are installed.",
    details: [],
    nextAction: null,
    step: "Step 1 of 18",
    docs: "docs/setup.md#local-tools",
    reason: null,
    needsDon: true,
  };

  it("accepts a valid report", () => {
    const result = checkReportSchema.safeParse({
      generatedAt: new Date().toISOString(),
      ok: true,
      counts: { complete: 1, missing: 0, pending: 0, couldNotCheck: 0, total: 1 },
      results: [validResult],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-complete result with no nextAction", () => {
    const result = checkReportSchema.safeParse({
      generatedAt: new Date().toISOString(),
      ok: false,
      counts: { complete: 0, missing: 1, pending: 0, couldNotCheck: 0, total: 1 },
      results: [{ ...validResult, status: "missing", nextAction: null }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a could-not-check result with no reason", () => {
    const result = checkReportSchema.safeParse({
      generatedAt: new Date().toISOString(),
      ok: false,
      counts: { complete: 0, missing: 0, pending: 0, couldNotCheck: 1, total: 1 },
      results: [
        { ...validResult, status: "could-not-check", nextAction: "Do something.", reason: null },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const result = checkReportSchema.safeParse({
      generatedAt: new Date().toISOString(),
      ok: false,
      counts: { complete: 0, missing: 0, pending: 0, couldNotCheck: 0, total: 1 },
      results: [{ ...validResult, status: "unknown" }],
    });
    expect(result.success).toBe(false);
  });
});
