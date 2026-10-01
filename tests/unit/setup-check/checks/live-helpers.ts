// Shared fixtures for the post-launch check tests (items 28 to 32). Not a test file itself.
import { expect } from "vitest";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type {
  CheckResult,
  DnsRecordType,
  DnsResolverAnswers,
  HttpResponseSummary,
  ProviderContext,
} from "../../../../scripts/setup-check/types.ts";
import { envFrom, fakeProviderContext, loadFixture } from "./test-helpers.ts";

export const PENDING_SUFFIX =
  "If this is still pending 24 hours after the switch, treat it as a problem and see docs/launch.md#rollback.";
export const ENV = { CLOUDFLARE_API_TOKEN: "cf-token-0123456789", CLOUDFLARE_ACCOUNT_ID: "acct-0123456789abcdef" };
export const CONFIG = {
  zone: "doncoleman.ca",
  workerName: "dcc-web",
  ghostMarker: "Ghost",
  launch: {
    expectedPages: ["index"],
    expectedPaths: ["/", "/about/"],
  },
};
export const BASELINE = {
  originalNameservers: ["ns1.squarespacedns.com"],
  records: [
    { type: "A", name: "doncoleman.ca", content: "49.13.201.194", priority: null, ttl: 14400, source: "squarespace", decision: "keep", reason: null },
    { type: "CNAME", name: "www.doncoleman.ca", content: "drift-and-convergence.mymagic.page", priority: null, ttl: 14400, source: "squarespace", decision: "keep", reason: null },
  ],
};

export type Phase = "before-switch" | "switched" | "unreadable";

export function settledAnswers(name: string): DnsResolverAnswers[] {
  const answer = (resolver: string): DnsResolverAnswers => ({
    resolver,
    answers: [{ type: "A", name, value: "104.21.0.1" }],
  });
  return [answer("1.1.1.1"), answer("8.8.8.8")];
}

/** One resolver still returns a Ghost target, the other already answers with a Cloudflare address. */
export const ghostAnswers = (name: string, type: DnsRecordType, value: string): DnsResolverAnswers[] => [
  { resolver: "1.1.1.1", answers: [{ type, name, value }] },
  { resolver: "8.8.8.8", answers: [{ type: "A", name, value: "104.21.0.1" }] },
];

export const emptyAnswers: DnsResolverAnswers[] = [
  { resolver: "1.1.1.1", answers: [] },
  { resolver: "8.8.8.8", answers: [] },
];

export function tlsError(): ProviderAccessError {
  return new ProviderAccessError("request failed: certificate not valid", "tls");
}

export interface LiveOptions {
  phase?: Phase;
  /** DNS answers; by default the name resolves to the same Cloudflare address at both resolvers (A only). */
  dns?: (name: string, type: DnsRecordType) => DnsResolverAnswers[];
  get?: (url: string) => HttpResponseSummary | ProviderAccessError;
  config?: unknown;
}

export function liveContext(options: LiveOptions = {}): ProviderContext & { calls: Array<{ url: string; redirect?: string }> } {
  const phase = options.phase ?? "switched";
  const calls: Array<{ url: string; redirect?: string }> = [];
  const ctx = fakeProviderContext({
    env: envFrom(ENV),
    fs: {
      readJson: ((path: string) => {
        if (path === "setup/config.json") return options.config ?? CONFIG;
        if (path === "setup/dns-baseline.json") return BASELINE;
        return null;
      }) as never,
    },
    cloudflare: {
      listWorkerDomains: async () => {
        if (phase === "unreadable") throw new ProviderAccessError(`Cloudflare rejected ${ENV.CLOUDFLARE_API_TOKEN}`);
        return loadFixture("cloudflare", phase === "switched" ? "worker-domains-apex-switched" : "worker-domains-review-host");
      },
    },
    dns: {
      resolveEach: async (name: string, type: DnsRecordType) =>
        options.dns ? options.dns(name, type) : type === "A" ? settledAnswers(name) : emptyAnswers,
    },
    http: {
      get: async (url: string, opts?: { redirect?: "follow" | "manual" }) => {
        calls.push({ url, redirect: opts?.redirect });
        const result = options.get ? options.get(url) : { status: 200, headers: {}, body: "" };
        if (result instanceof Error) throw result;
        return result;
      },
    },
  });
  return Object.assign(ctx, { calls });
}

export function expectPendingSuffix(result: CheckResult): void {
  expect(result.status).toBe("pending");
  expect(result.nextAction?.endsWith(PENDING_SUFFIX)).toBe(true);
}
