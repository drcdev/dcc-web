import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NO_NETWORK_REASON,
  UsageError,
  main,
  noNetworkContext,
  parseArgs,
  runChecks,
} from "../../../scripts/setup-check/cli.ts";
import { checkReportSchema } from "../../../scripts/setup-check/schemas.ts";
import { ProviderAccessError } from "../../../scripts/setup-check/types.ts";
import type { CheckResult, ProviderContext, SetupItem } from "../../../scripts/setup-check/types.ts";

function fakeCtx(overrides: Partial<ProviderContext> = {}): ProviderContext {
  return {
    github: { api: vi.fn(), authStatus: vi.fn() } as never,
    cloudflare: {
      verifyToken: vi.fn(),
      getZone: vi.fn(),
      listZones: vi.fn(),
      listDnsRecords: vi.fn(),
      getWorkerScript: vi.fn(),
      getWorkersSubdomain: vi.fn(),
      listWebAnalyticsSites: vi.fn(),
    } as never,
    dns: { resolve: vi.fn(), resolveNameservers: vi.fn() } as never,
    http: { get: vi.fn(), head: vi.fn() } as never,
    env: { get: vi.fn(() => undefined), has: vi.fn(() => false) },
    fs: { readText: vi.fn(() => null), readJson: vi.fn(() => null), exists: vi.fn(() => false), listFiles: vi.fn(() => []) },
    now: () => new Date("2026-09-28T12:00:00.000Z"),
    ...overrides,
  };
}

function fakeItem(id: string, order: number, check: SetupItem["check"], dependsOn: string[] = []): SetupItem {
  return {
    id,
    order,
    title: `Title ${id}`,
    purpose: "purpose",
    where: "where",
    confirmedBy: "confirmedBy",
    needsDon: true,
    principles: ["II"],
    requirements: ["FR-001"],
    secrets: [],
    dependsOn,
    phase: "before-merge",
    check,
  };
}

function completeResult(id: string, order: number): CheckResult {
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

function missingResult(id: string, order: number): CheckResult {
  return {
    id,
    status: "missing",
    summary: `${id} is missing.`,
    details: [],
    nextAction: `Do something for ${id}.`,
    step: `Step ${order} of 18`,
    docs: `docs/setup.md#${id}`,
    reason: null,
  };
}

describe("setup-check/cli parseArgs", () => {
  it("defaults to no flags", () => {
    expect(parseArgs([])).toEqual({ json: false, items: null, noNetwork: false });
  });

  it("parses --json and --no-network", () => {
    expect(parseArgs(["--json", "--no-network"])).toEqual({ json: true, items: null, noNetwork: true });
  });

  it("collects repeated --item flags", () => {
    expect(parseArgs(["--item", "local-tools", "--item", "cloudflare-zone"])).toEqual({
      json: false,
      items: ["local-tools", "cloudflare-zone"],
      noNetwork: false,
    });
  });

  it("throws UsageError on an unknown flag", () => {
    expect(() => parseArgs(["--bogus"])).toThrow(UsageError);
  });

  it("throws UsageError when --item has no value", () => {
    expect(() => parseArgs(["--item"])).toThrow(UsageError);
  });
});

describe("setup-check/cli runChecks", () => {
  it("runs every item when --item is not given", async () => {
    const items = [
      fakeItem("a", 1, async () => completeResult("a", 1)),
      fakeItem("b", 2, async () => completeResult("b", 2)),
    ];
    const { results } = await runChecks({ items, parsed: { json: false, items: null, noNetwork: false }, ctx: fakeCtx() });

    expect(results.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("filters to the named items with --item", async () => {
    const items = [
      fakeItem("a", 1, async () => completeResult("a", 1)),
      fakeItem("b", 2, async () => completeResult("b", 2)),
    ];
    const { results } = await runChecks({
      items,
      parsed: { json: false, items: ["b"], noNetwork: false },
      ctx: fakeCtx(),
    });

    expect(results.map((r) => r.id)).toEqual(["b"]);
  });

  it("reports a usage error for an unknown --item id", async () => {
    const items = [fakeItem("a", 1, async () => completeResult("a", 1))];
    const { results, usageError } = await runChecks({
      items,
      parsed: { json: false, items: ["nope"], noNetwork: false },
      ctx: fakeCtx(),
    });

    expect(usageError).toBe("unknown item: nope");
    expect(results).toEqual([]);
  });

  it("an item whose dependsOn prerequisite is not complete is reported missing naming the prerequisite (via the item's own check)", async () => {
    // The dependent item's
    // check function evaluates its prerequisite itself; the CLI does not
    // need separate dependsOn logic.
    const prereqCheck: SetupItem["check"] = async () => missingResult("prereq", 1);
    const dependent: SetupItem["check"] = async (ctx) => {
      const prereq = await prereqCheck(ctx);
      if (prereq.status !== "complete") {
        return {
          id: "dependent",
          status: "missing",
          summary: "prereq (step 1) is not complete yet.",
          details: [],
          nextAction: "Complete prereq first: finish step 1 (prereq), then try again.",
          step: "Step 2 of 18",
          docs: "docs/setup.md#dependent",
          reason: null,
        };
      }
      return completeResult("dependent", 2);
    };
    const items = [fakeItem("prereq", 1, prereqCheck), fakeItem("dependent", 2, dependent, ["prereq"])];

    const { results } = await runChecks({
      items,
      parsed: { json: false, items: ["dependent"], noNetwork: false },
      ctx: fakeCtx(),
    });

    expect(results[0]!.status).toBe("missing");
    expect(results[0]!.nextAction).toContain("prereq");
  });

  it("--no-network marks every non-local item could-not-check with 'skipped: --no-network' and never calls its check", async () => {
    const check = vi.fn(async () => completeResult("cloudflare-zone", 3));
    const items = [fakeItem("cloudflare-zone", 3, check)];

    const { results } = await runChecks({
      items,
      parsed: { json: false, items: null, noNetwork: true },
      ctx: fakeCtx(),
    });

    expect(results[0]!.status).toBe("could-not-check");
    expect(results[0]!.reason).toBe(NO_NETWORK_REASON);
    expect(check).not.toHaveBeenCalled();
  });

  it("--no-network still runs local-tools' own check, with network calls stubbed to reject instantly", async () => {
    const check = vi.fn(async (ctx: ProviderContext) => {
      try {
        await ctx.github.authStatus();
        return completeResult("local-tools", 1);
      } catch (err) {
        return {
          id: "local-tools",
          status: "could-not-check" as const,
          summary: "Could not confirm the GitHub CLI sign-in.",
          details: [],
          nextAction: "Try again.",
          step: "Step 1 of 18",
          docs: "docs/setup.md#local-tools",
          reason: err instanceof ProviderAccessError ? err.reason : String(err),
        };
      }
    });
    const items = [fakeItem("local-tools", 1, check)];

    const { results } = await runChecks({
      items,
      parsed: { json: false, items: null, noNetwork: true },
      ctx: fakeCtx(),
    });

    expect(check).toHaveBeenCalledTimes(1);
    expect(results[0]!.status).toBe("could-not-check");
    expect(results[0]!.reason).toBe(NO_NETWORK_REASON);
  });
});

describe("setup-check/cli noNetworkContext", () => {
  it("rejects every github and cloudflare call with the no-network reason", async () => {
    const ctx = noNetworkContext(fakeCtx());

    await expect(ctx.github.authStatus()).rejects.toThrow(NO_NETWORK_REASON);
    await expect(ctx.cloudflare.verifyToken()).rejects.toThrow(NO_NETWORK_REASON);
  });
});

describe("setup-check/cli main", () => {
  let stdout: string[];
  let stderr: string[];

  beforeEach(() => {
    stdout = [];
    stderr = [];
  });

  function options(items: SetupItem[], ctx: ProviderContext) {
    return {
      items,
      ctx,
      stdout: (text: string) => stdout.push(text),
      stderr: (text: string) => stderr.push(text),
    };
  }

  it("exits 0 when every item is complete", async () => {
    const items = [fakeItem("a", 1, async () => completeResult("a", 1))];
    const code = await main([], options(items, fakeCtx()));

    expect(code).toBe(0);
  });

  it("exits 1 when any item is not complete", async () => {
    const items = [fakeItem("a", 1, async () => missingResult("a", 1))];
    const code = await main([], options(items, fakeCtx()));

    expect(code).toBe(1);
  });

  it("exits 2 on an unknown flag", async () => {
    const items = [fakeItem("a", 1, async () => completeResult("a", 1))];
    const code = await main(["--bogus"], options(items, fakeCtx()));

    expect(code).toBe(2);
    expect(stderr.join("")).toMatch(/unknown flag/);
  });

  it("exits 2 on an unknown --item id", async () => {
    const items = [fakeItem("a", 1, async () => completeResult("a", 1))];
    const code = await main(["--item", "nope"], options(items, fakeCtx()));

    expect(code).toBe(2);
  });

  it("exits 2 when a committed setup/*.json file is invalid", async () => {
    const items = [fakeItem("a", 1, async () => completeResult("a", 1))];
    const ctx = fakeCtx({
      fs: {
        readText: vi.fn(() => null),
        readJson: vi.fn((path: string) => (path === "setup/config.json" ? { owner: "" } : null)) as never,
        exists: vi.fn(() => false),
        listFiles: vi.fn(() => []),
      },
    });
    const code = await main([], options(items, ctx));

    expect(code).toBe(2);
    expect(stderr.join("")).toMatch(/setup\/config\.json is invalid/);
  });

  it("--json output validates against the report schema", async () => {
    const items = [fakeItem("a", 1, async () => completeResult("a", 1))];
    const code = await main(["--json"], options(items, fakeCtx()));

    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.join(""));
    expect(checkReportSchema.safeParse(parsed).success).toBe(true);
  });
});

describe("setup-check/cli main redacts a secret leaked through a thrown error (FR-005, FR-030, partial)", () => {
  it("never prints a CLOUDFLARE_API_TOKEN value that a check's thrown Error message contains, in --json or human output", async () => {
    const canary = `canary-secret-${Math.random().toString(36).slice(2)}-value`;
    const items = [
      fakeItem("cloudflare-zone", 3, async () => {
        throw new Error(`Cloudflare rejected token ${canary}`);
      }),
    ];
    const ctx = fakeCtx({ env: { get: vi.fn((name: string) => (name === "CLOUDFLARE_API_TOKEN" ? canary : undefined)), has: vi.fn(() => true) } });

    let stdout: string[] = [];
    let stderr: string[] = [];
    const jsonCode = await main(["--json"], {
      items,
      ctx,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });
    expect(jsonCode).toBe(1);
    expect(stdout.join("")).not.toContain(canary);
    expect(stderr.join("")).not.toContain(canary);
    expect(stdout.join("")).toContain("[redacted]");

    stdout = [];
    stderr = [];
    const humanCode = await main([], {
      items,
      ctx,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });
    expect(humanCode).toBe(1);
    expect(stdout.join("")).not.toContain(canary);
    expect(stderr.join("")).not.toContain(canary);
    expect(stdout.join("")).toContain("[redacted]");
  });
});

describe("setup-check/cli per-call timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports could-not-check when a check does not resolve within 10 seconds", async () => {
    const items = [fakeItem("slow", 1, () => new Promise<CheckResult>(() => {}))];

    const runPromise = runChecks({ items, parsed: { json: false, items: null, noNetwork: false }, ctx: fakeCtx() });
    await vi.advanceTimersByTimeAsync(10_000);
    const { results } = await runPromise;

    expect(results[0]!.status).toBe("could-not-check");
    expect(results[0]!.reason).toMatch(/timed out/);
  });
});

describe("setup-check/cli exit code", () => {
  it("exits 1 when an item is missing", async () => {
    const items = [fakeItem("one", 1, async () => missingResult("one", 1))];
    const code = await main(["--json"], { items, ctx: fakeCtx(), stdout: () => {}, stderr: () => {} });
    expect(code).toBe(1);
  });
});
