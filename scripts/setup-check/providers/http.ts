// Read-only HTTP provider: global fetch, GET/HEAD only, for HTTPS, header and
// Ghost-marker probes (FR-004, FR-020, FR-038).
import {
  ProviderAccessError,
  type HttpGetOptions,
  type HttpReader,
  type HttpResponseSummary,
  type ProviderAccessErrorKind,
} from "../types.ts";

const HTTP_TIMEOUT_MS = 10_000;
// Ask for pages the way a browser does. Node's fetch defaults to `Accept: */*`,
// and Cloudflare only injects the Web Analytics beacon (setup item 17) into
// responses whose request accepts HTML, so a `*/*` probe would report the
// beacon missing on a page every visitor actually receives with it.
const HEADERS = { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" };

// A failed TLS handshake means the certificate is not issued (or not valid) yet. Node reports it in
// the fetch error's `cause.code` (011-launch research R7).
const TLS_CODE = /^(ERR_TLS_|ERR_SSL_|UNABLE_TO_VERIFY_|CERT_|DEPTH_ZERO_|SELF_SIGNED_|EPROTO$)/;
const TLS_RESET_MESSAGE = /secure TLS connection|handshake/i;

function failureCode(err: unknown): string {
  const cause = (err as { cause?: { code?: unknown } } | undefined)?.cause;
  return typeof cause?.code === "string" ? cause.code : "";
}

/** Classifies a failed request: `tls` for a handshake or certificate failure, `timeout` for an abort, else `network`. */
function classifyFailure(err: unknown): ProviderAccessErrorKind {
  if (err instanceof Error && err.name === "AbortError") return "timeout";
  const code = failureCode(err);
  if (TLS_CODE.test(code)) return "tls";
  const message = `${err instanceof Error ? err.message : ""} ${(err as { cause?: { message?: string } } | undefined)?.cause?.message ?? ""}`;
  if (code === "ECONNRESET" && TLS_RESET_MESSAGE.test(message)) return "tls";
  return "network";
}

async function request(url: string, method: "GET" | "HEAD", options: HttpGetOptions = {}): Promise<HttpResponseSummary> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  const redirect = options.redirect ?? "follow";
  try {
    const response =
      method === "HEAD"
        ? await fetch(url, { method: "HEAD", headers: HEADERS, redirect, signal: controller.signal })
        : await fetch(url, { method: "GET", headers: HEADERS, redirect, signal: controller.signal });
    const body = method === "HEAD" ? "" : await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return { status: response.status, headers, body };
  } catch (err) {
    const kind = classifyFailure(err);
    if (kind === "timeout") {
      throw new ProviderAccessError(`request to ${url} timed out after ${HTTP_TIMEOUT_MS / 1000} seconds`, kind);
    }
    throw new ProviderAccessError(`request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`, kind);
  } finally {
    clearTimeout(timer);
  }
}

export function createHttpReader(): HttpReader {
  return {
    get(url: string, options?: HttpGetOptions): Promise<HttpResponseSummary> {
      return request(url, "GET", options);
    },
    head(url: string): Promise<HttpResponseSummary> {
      return request(url, "HEAD");
    },
  };
}
