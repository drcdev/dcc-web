import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { vi } from "vitest";
import worker from "../src/index";
import { hashIp } from "../src/contact/ip-hash";

/** The salted hash the Worker stores for a sender IP. */
export function ipHashFor(ip: string) {
  return hashIp(ip, env.IP_HASH_SALT);
}

export const ORIGIN = "https://example.com";
export const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function validBody(overrides: Record<string, unknown> = {}) {
  return {
    submission_id: crypto.randomUUID(),
    name: "Ada Lovelace",
    email: "ada@example.com",
    organization: "",
    message: "Hello there",
    consent: true,
    website: "",
    turnstile_token: "token-123",
    ...overrides,
  };
}

export function post(body: unknown = validBody(), headers: Record<string, string> = {}, url = `${ORIGIN}/api/contact`) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(url).origin,
      "Sec-Fetch-Site": "same-origin",
      "CF-Connecting-IP": "203.0.113.7",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** Runs the Worker on a request. `envOverrides` replaces bindings for this request only (for example `{ AI, ASSETS }`). */
export async function run(request: Request, envOverrides: Partial<Env> = {}) {
  const ctx = createExecutionContext();
  const handler = worker as unknown as Required<ExportedHandler<Env>>;
  const bindings = { ...env, ...envOverrides } as Env;
  const response = await handler.fetch(request as Request<unknown, IncomingRequestCfProperties>, bindings, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

type Verdict = Record<string, unknown> | "network-error" | { status: number };

/** Mocks outbound fetch: siteverify answers with `verdict`; any other request fails the test. */
export function mockSiteverify(verdict: Verdict = { success: true, action: "contact", hostname: "example.com" }) {
  const calls: { url: string; body: URLSearchParams }[] = [];
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const raw = init?.body ?? (input instanceof Request ? await input.text() : "");
    calls.push({ url, body: new URLSearchParams(String(raw)) });
    if (url !== SITEVERIFY) throw new Error(`unexpected outbound request to ${url}`);
    if (verdict === "network-error") throw new TypeError("network down");
    if (Object.keys(verdict).length === 1 && "status" in verdict) {
      return new Response("bad", { status: verdict.status as number });
    }
    return new Response(JSON.stringify(verdict), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  return { calls, spy };
}

export async function rows() {
  const result = await env.DB.prepare("SELECT * FROM messages").all<Record<string, unknown>>();
  return result.results;
}

export async function clearRows() {
  await env.DB.prepare("DELETE FROM messages").run();
}

export const READ_TOKEN = "test-read-token";

/** A request to a retrieval route. `token: null` sends no Authorization header. */
export function api(
  path: string,
  {
    method = "GET",
    token = READ_TOKEN,
    headers = {},
  }: { method?: string; token?: string | null; headers?: Record<string, string> } = {},
) {
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers: { ...(token === null ? {} : { Authorization: `Bearer ${token}` }), ...headers },
  });
}

export interface SeedMessage {
  id?: string;
  name?: string;
  status?: "new" | "read";
  received_at?: number;
  project?: string | null;
  organization?: string | null;
  ip_hash?: string | null;
}

/** Inserts one row directly and returns its id. */
export async function seedMessage(overrides: SeedMessage = {}) {
  const id = overrides.id ?? crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO messages (id, name, email, organization, project, message, ip_hash, status, received_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
  )
    .bind(
      id,
      overrides.name ?? "Ada Example",
      "ada@example.com",
      overrides.organization ?? null,
      overrides.project ?? null,
      "Hello",
      overrides.ip_hash === undefined ? "a".repeat(64) : overrides.ip_hash,
      overrides.status ?? "new",
      overrides.received_at ?? Date.parse("2026-09-29T17:04:11.000Z"),
    )
    .run();
  return id;
}

export interface FakeAiOptions {
  /** Text the model answers with (the `response` field of a text-generation result). */
  text?: string;
  /** The model call rejects with this error. */
  throws?: unknown;
  /** The model call never settles. */
  hangs?: boolean;
}

/** A stand-in for the `AI` binding. `run` records every call, so a test can count model calls. */
export function fakeAi({ text = "", throws, hangs }: FakeAiOptions = {}) {
  const calls: { model: string; inputs: unknown; options?: unknown }[] = [];
  const ai = {
    calls,
    run: async (model: string, inputs: unknown, options?: unknown) => {
      calls.push({ model, inputs, options });
      if (hangs) return new Promise<never>(() => {});
      if (throws !== undefined) throw throws;
      return { response: text };
    },
  };
  return ai as typeof ai & Ai;
}

/** A stand-in for the `ASSETS` binding: serves `files` (path to body) as JSON, 404 for any other path. */
export function fakeAssets(files: Record<string, unknown> = {}) {
  const requested: string[] = [];
  const assets = {
    requested,
    fetch: async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input), "https://assets.invalid");
      requested.push(url.pathname);
      if (!(url.pathname in files)) return new Response("Not found", { status: 404 });
      const body = files[url.pathname];
      return new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
  return assets as typeof assets & Fetcher;
}

/** The body of a `question-source.json` file with a correct hash (data-model section 1). */
export async function makeSource({
  slug,
  text,
  title = "A post title",
  summary = "A post summary.",
}: {
  slug: string;
  text: string;
  title?: string;
  summary?: string;
}) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([title, summary, text])));
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return { slug, title, summary, text, hash };
}
