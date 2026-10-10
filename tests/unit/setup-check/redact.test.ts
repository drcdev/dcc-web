import { describe, expect, it } from "vitest";
import { buildReport, formatHumanReport, formatJsonReport } from "../../../scripts/setup-check/report.ts";
import { ProviderAccessError } from "../../../scripts/setup-check/types.ts";
import type { CheckResult, SetupItem } from "../../../scripts/setup-check/types.ts";
import { expectRedacted } from "./checks/test-helpers.ts";

// FR-026: no launch output contains a token, account id, zone id, environment value or message content.
const SECRETS = ["cf-token-0123456789abcdefghij", "acct0123456789abcdef0123456789ab", "zone0123456789abcdef0123456789ab"];

describe("expectRedacted helper (T008)", () => {
  it("passes for a result or error without the secrets", () => {
    expectRedacted({ summary: "Waiting for the switch: nothing here" }, SECRETS);
    expectRedacted(new ProviderAccessError("CLOUDFLARE_API_TOKEN is not set in .env."), SECRETS);
  });

  it("fails when a secret appears anywhere in a result, an error message or an error reason", () => {
    expect(() => expectRedacted({ details: [`zone ${SECRETS[2]}`] }, SECRETS)).toThrow();
    expect(() => expectRedacted(new ProviderAccessError(`bad ${SECRETS[0]}`), SECRETS)).toThrow();
    expect(() => expectRedacted(new Error(`bad ${SECRETS[1]}`), SECRETS)).toThrow();
  });
});

describe("waiting report output (T008)", () => {
  const waiting: CheckResult = {
    id: "web-analytics",
    status: "waiting",
    summary: `Waiting for the switch: doncoleman.ca is not on the new site yet. ${SECRETS[0]}`,
    details: [`account ${SECRETS[1]}`],
    nextAction: `Nothing to do yet. ${SECRETS[2]}`,
    step: "Step 15 of 22",
    docs: "docs/setup.md#web-analytics",
    reason: null,
  };
  const item: SetupItem = {
    id: "web-analytics",
    order: 15,
    title: "Bare domain serves the new site",
    purpose: "p",
    where: "w",
    confirmedBy: "c",
    needsDon: false,
    principles: ["II"],
    requirements: ["FR-017"],
    secrets: [],
    dependsOn: [],
    phase: "after-merge",
    check: async () => waiting,
  };

  it("redacts known secret values from the human and JSON output", () => {
    const report = buildReport([waiting], [item], { secretValues: SECRETS });
    expectRedacted(formatHumanReport(report), SECRETS);
    expectRedacted(formatJsonReport(report), SECRETS);
    expect(formatHumanReport(report)).toContain("waiting");
  });
});
