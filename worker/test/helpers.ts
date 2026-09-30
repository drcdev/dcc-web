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
