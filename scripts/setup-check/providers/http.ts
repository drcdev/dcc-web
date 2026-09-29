// Read-only HTTP provider: global fetch, GET/HEAD only, for HTTPS, header and
// Ghost-marker probes (FR-004, FR-020, FR-038).
import { ProviderAccessError, type HttpReader, type HttpResponseSummary } from "../types.ts";

const HTTP_TIMEOUT_MS = 10_000;

async function request(url: string, method: "GET" | "HEAD"): Promise<HttpResponseSummary> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response =
      method === "HEAD"
        ? await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal })
        : await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    const body = method === "HEAD" ? "" : await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return { status: response.status, headers, body };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ProviderAccessError(`request to ${url} timed out after ${HTTP_TIMEOUT_MS / 1000} seconds`);
    }
    throw new ProviderAccessError(
      `request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export function createHttpReader(): HttpReader {
  return {
    get(url: string): Promise<HttpResponseSummary> {
      return request(url, "GET");
    },
    head(url: string): Promise<HttpResponseSummary> {
      return request(url, "HEAD");
    },
  };
}
