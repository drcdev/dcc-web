// Shared test helpers for scripts/setup-check/checks/*.test.ts: a fake
// ProviderContext builder (every reader defaults to "not configured for this
// test" so a check calling an un-stubbed reader fails loudly) and a loader for
// the recorded fixtures under tests/fixtures/providers/ (FR-006). Not a test
// file itself (no .test.ts suffix), so vitest's include glob skips it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, vi } from "vitest";
import type {
  CloudflareDnsRecord,
  CloudflareReader,
  CloudflareWebAnalyticsSite,
  CloudflareWorkerScript,
  CloudflareWorkersSubdomain,
  CloudflareZone,
  DnsReader,
  EnvReader,
  GitHubReader,
  HttpReader,
  ProviderContext,
  RepoReader,
} from "../../../../scripts/setup-check/types.ts";

const fixturesRoot = fileURLToPath(new URL("../../../fixtures/providers/", import.meta.url));

/** Loads a recorded fixture JSON file (tests/fixtures/providers/<category>/<name>.json). */
export function loadFixture<T = unknown>(category: string, name: string): T {
  const text = readFileSync(`${fixturesRoot}${category}/${name}.json`, "utf-8");
  return JSON.parse(text) as T;
}

/** Raw Cloudflare zone fixture shape (snake_case, as the SDK returns it) -> CloudflareZone. */
export function toCloudflareZone(raw: {
  id: string;
  name: string;
  status: string;
  plan?: { name?: string };
  name_servers?: string[];
}): CloudflareZone {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    plan: raw.plan?.name,
    nameServers: raw.name_servers ?? [],
  };
}

function notConfigured(name: string) {
  return vi.fn(async () => {
    throw new Error(`fake ${name} not configured for this test`);
  });
}

export interface FakeProviderOverrides {
  github?: Partial<GitHubReader>;
  cloudflare?: Partial<CloudflareReader>;
  dns?: Partial<DnsReader>;
  http?: Partial<HttpReader>;
  env?: Partial<EnvReader>;
  fs?: Partial<RepoReader>;
  now?: () => Date;
}

/** A ProviderContext where every reader method throws unless overridden — makes an un-stubbed call fail the test loudly rather than silently returning undefined. */
export function fakeProviderContext(overrides: FakeProviderOverrides = {}): ProviderContext {
  const github: GitHubReader = {
    api: notConfigured("github.api"),
    authStatus: notConfigured("github.authStatus"),
    ...overrides.github,
  };
  const cloudflare: CloudflareReader = {
    verifyToken: notConfigured("cloudflare.verifyToken"),
    getZone: notConfigured("cloudflare.getZone"),
    listZones: notConfigured("cloudflare.listZones"),
    listDnsRecords: notConfigured("cloudflare.listDnsRecords"),
    getWorkerScript: notConfigured("cloudflare.getWorkerScript"),
    getWorkersSubdomain: notConfigured("cloudflare.getWorkersSubdomain"),
    listWebAnalyticsSites: notConfigured("cloudflare.listWebAnalyticsSites"),
    listD1Databases: notConfigured("cloudflare.listD1Databases"),
    listD1AppliedMigrations: notConfigured("cloudflare.listD1AppliedMigrations"),
    listWorkerSecretNames: notConfigured("cloudflare.listWorkerSecretNames"),
    listWorkerCrons: notConfigured("cloudflare.listWorkerCrons"),
    listBuildTriggers: notConfigured("cloudflare.listBuildTriggers"),
    listBuildVariableNames: notConfigured("cloudflare.listBuildVariableNames"),
    listTurnstileWidgets: notConfigured("cloudflare.listTurnstileWidgets"),
    ...overrides.cloudflare,
  };
  const dns: DnsReader = {
    resolve: notConfigured("dns.resolve"),
    resolveEach: notConfigured("dns.resolveEach"),
    resolveNameservers: notConfigured("dns.resolveNameservers"),
    ...overrides.dns,
  };
  const http: HttpReader = {
    get: notConfigured("http.get"),
    head: notConfigured("http.head"),
    ...overrides.http,
  };
  const env: EnvReader = {
    get: vi.fn(() => undefined),
    has: vi.fn(() => false),
    ...overrides.env,
  };
  const fs: RepoReader = {
    readText: vi.fn(() => null),
    readJson: vi.fn(() => null),
    exists: vi.fn(() => false),
    listFiles: vi.fn(() => []),
    ...overrides.fs,
  };
  return {
    github,
    cloudflare,
    dns,
    http,
    env,
    fs,
    now: overrides.now ?? (() => new Date("2026-09-28T12:00:00.000Z")),
  };
}

/** An EnvReader backed by a plain object, matching providers/env.ts's injectable-source shape. */
export function envFrom(values: Record<string, string | undefined>): Partial<EnvReader> {
  return {
    get: vi.fn((name: string) => {
      const value = values[name];
      return value && value.length > 0 ? value : undefined;
    }),
    has: vi.fn((name: string) => {
      const value = values[name];
      return typeof value === "string" && value.length > 0;
    }),
  };
}

/**
 * FR-026: asserts that a check result, report text or thrown error never contains any of the given
 * secret values (a token, account id, zone id, environment value or message content). Looks at the
 * JSON form of a result and at both `message` and `reason` of an error.
 */
export function expectRedacted(subject: unknown, secrets: string[]): void {
  const texts: string[] = [];
  if (subject instanceof Error) {
    texts.push(subject.message, String((subject as { reason?: unknown }).reason ?? ""));
  } else if (typeof subject === "string") {
    texts.push(subject);
  } else {
    texts.push(JSON.stringify(subject));
  }
  for (const secret of secrets) {
    for (const text of texts) {
      expect(text, "output must not contain a secret value").not.toContain(secret);
    }
  }
}

export const cloudflareDnsRecordsAllPresent =() => loadFixture<CloudflareDnsRecord[]>("cloudflare", "dns-records-matching-baseline");

export type {
  CloudflareDnsRecord,
  CloudflareWebAnalyticsSite,
  CloudflareWorkerScript,
  CloudflareWorkersSubdomain,
  CloudflareZone,
};
