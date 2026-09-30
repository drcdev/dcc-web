import { json } from "../http";
import { hashIp } from "./ip-hash";
import { DUPLICATE_CHECK_SQL, INSERT_MESSAGE_SQL } from "./queries";
import { checkRateLimit } from "./rate-limit";
import { BODY_MAX_BYTES, validateSubmission } from "./rules";
import { TOKEN_MAX, verifyTurnstile } from "./turnstile";

type Outcome =
  | "stored"
  | "honeypot"
  | "duplicate"
  | "invalid"
  | "turnstile_failed"
  | "rate_limited"
  | "unavailable"
  | "forbidden"
  | "too_large";

// One structured line per request, outcome only (FR-016). Never a value, IP, hash or token.
function log(outcome: Outcome, error?: unknown): void {
  const line: Record<string, string> = { event: "contact", outcome };
  if (outcome === "unavailable") line.name = error instanceof Error ? error.name : "UnknownError";
  console.log(JSON.stringify(line));
}

const ok = () => json({ ok: true });
const fail = (
  status: number,
  error: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) => json({ ok: false, error, ...extra }, status, headers);

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

function isSameOriginRequest(request: Request, url: URL): boolean {
  if (url.protocol !== "https:" && !(url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname))) return false;
  if (request.headers.get("Origin") !== url.origin) return false;
  const site = request.headers.get("Sec-Fetch-Site");
  return site === null || site === "same-origin";
}

/** Reads the body through a byte counter; null when it grows past the cap. */
async function readCapped(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > BODY_MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function handleSubmit(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const url = new URL(request.url);
  if (!isSameOriginRequest(request, url)) {
    log("forbidden");
    return fail(403, "forbidden");
  }

  const contentType = (request.headers.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return fail(415, "unsupported_media_type");

  const declared = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declared) && declared > BODY_MAX_BYTES) {
    log("too_large");
    return fail(413, "too_large");
  }
  const raw = await readCapped(request);
  if (raw === null) {
    log("too_large");
    return fail(413, "too_large");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    log("invalid");
    return fail(400, "invalid_json");
  }
  const body = parsed as Record<string, unknown>;

  // 1. Honeypot: pretend success, touch nothing (FR-011).
  if (typeof body.website === "string" && body.website !== "") {
    log("honeypot");
    return ok();
  }

  // 2. Validation, every field error at once.
  const validation = validateSubmission(body);
  if (!validation.ok) {
    log("invalid");
    return fail(400, "validation", { fields: validation.fields });
  }
  const submission = validation.value;

  try {
    // 3. Duplicate submission id: the earlier one was stored, so this one succeeds (R8).
    const existing = await env.DB.prepare(DUPLICATE_CHECK_SQL).bind(submission.id).first();
    if (existing) {
      log("duplicate");
      return ok();
    }

    // 4. Turnstile.
    const token = typeof body.turnstile_token === "string" ? body.turnstile_token : "";
    if (token === "" || token.length > TOKEN_MAX) {
      log("turnstile_failed");
      return fail(422, "turnstile_failed");
    }
    const remoteIp = request.headers.get("CF-Connecting-IP");
    const verified = await verifyTurnstile({
      secret: env.TURNSTILE_SECRET_KEY,
      token,
      remoteIp,
      idempotencyKey: submission.id,
      hostname: url.hostname,
    });
    if (!verified) {
      log("turnstile_failed");
      return fail(422, "turnstile_failed");
    }

    // 5. Rate limit. Only CF-Connecting-IP identifies the sender (X-Forwarded-For is ignored);
    //    a missing header counts against one shared "unknown" sender (FR-013b).
    const ipHash = await hashIp(remoteIp || "unknown", env.IP_HASH_SALT);
    const limit = await checkRateLimit(env.DB, ipHash, Date.now());
    if (limit.limited) {
      log("rate_limited");
      return fail(429, "rate_limited", {}, { "Retry-After": String(limit.retryAfter) });
    }

    // 6. Insert.
    await env.DB.prepare(INSERT_MESSAGE_SQL)
      .bind(
        submission.id,
        submission.name,
        submission.email,
        submission.organization,
        submission.project,
        submission.message,
        ipHash,
        Date.now(),
      )
      .run();
    log("stored");
    return ok();
  } catch (error) {
    // 7. Any dependency failure fails closed (FR-012a).
    log("unavailable", error);
    return fail(503, "unavailable");
  }
}
