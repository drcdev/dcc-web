import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { vi } from "vitest";
import worker from "../src/index";

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

export async function run(request: Request) {
  const ctx = createExecutionContext();
  const handler = worker as unknown as Required<ExportedHandler<Env>>;
  const response = await handler.fetch(request as Request<unknown, IncomingRequestCfProperties>, env, ctx);
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
      "a".repeat(64),
      overrides.status ?? "new",
      overrides.received_at ?? Date.parse("2026-09-29T17:04:11.000Z"),
    )
    .run();
  return id;
}
