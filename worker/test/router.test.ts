import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import worker from "../src/index";

async function call(path: string, init?: RequestInit) {
  const ctx = createExecutionContext();
  const handler = worker as unknown as Required<ExportedHandler<Env>>;
  const request = new Request(`https://example.com${path}`, init) as Request<unknown, IncomingRequestCfProperties>;
  const response = await handler.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

describe("router", () => {
  it("answers an unknown /api path with a JSON 404", async () => {
    const response = await call("/api/nope");
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  it("carries the Worker security headers and no CORS headers", async () => {
    const response = await call("/api/nope");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    for (const [name] of response.headers) {
      expect(name.toLowerCase().startsWith("access-control-")).toBe(false);
    }
  });

  it("does not answer OPTIONS with CORS", async () => {
    const response = await call("/api/nope", { method: "OPTIONS" });
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
  });

  describe("the retired retrieval routes (FR-010, SC-005)", () => {
    const paths = [
      "/api/messages",
      "/api/messages/new",
      "/api/messages/new?limit=1",
      "/api/messages/3f0c7c1e-8a5b-4d7e-9c1a-2b3c4d5e6f70",
      "/api/messages/3f0c7c1e-8a5b-4d7e-9c1a-2b3c4d5e6f70/read",
      "/api/messages/nope/deeper",
    ];
    const reference = async () => {
      const response = await call("/api/nope");
      return { body: await response.text(), headers: [...response.headers].sort(([a], [b]) => a.localeCompare(b)) };
    };

    it("answers every path and method with the unknown-route 404, with and without an old bearer token", async () => {
      const expected = await reference();
      expect(JSON.parse(expected.body)).toEqual({ error: "not_found" });
      for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
        for (const path of paths) {
          for (const headers of [{} as Record<string, string>, { Authorization: "Bearer test-read-token" }]) {
            const where = `${method} ${path} ${Object.keys(headers).length ? "with" : "without"} a token`;
            const response = await call(path, { method, headers });
            expect(response.status, where).toBe(404);
            expect(await response.text(), where).toBe(expected.body);
            expect([...response.headers].sort(([a], [b]) => a.localeCompare(b)), where).toEqual(expected.headers);
          }
        }
      }
    });
  });
});
