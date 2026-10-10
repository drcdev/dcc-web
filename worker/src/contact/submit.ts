import { json, parseJsonObject, readCapped } from "../http";
import { isSameOriginRequest } from "../same-origin";
import { buildContactEmail } from "./email";
import { BODY_MAX_BYTES, validateSubmission } from "./rules";
import { TOKEN_MAX, verifyTurnstile } from "./turnstile";

type Outcome =
  | "sent"
  | "honeypot"
  | "invalid"
  | "turnstile_failed"
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

  const raw = await readCapped(request, BODY_MAX_BYTES);
  if (raw === null) {
    log("too_large");
    return fail(413, "too_large");
  }

  const body = parseJsonObject(raw);
  if (body === null) {
    log("invalid");
    return fail(400, "invalid_json");
  }

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
    // 3. Turnstile.
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
      allowTestingKey: env.ALLOW_TURNSTILE_TESTING === "true",
    });
    if (!verified) {
      log("turnstile_failed");
      return fail(422, "turnstile_failed");
    }

    // 4. Email. Nothing is stored: success means send() resolved (FR-009, FR-012a).
    await env.CONTACT_EMAIL.send(
      buildContactEmail(submission, {
        receivedAt: Date.now(),
        preview: env.SITE_ENVIRONMENT === "preview",
        host: url.host,
      }),
    );
    log("sent");
    return ok();
  } catch (error) {
    // Any dependency failure fails closed, with no retry.
    log("unavailable", error);
    return fail(503, "unavailable");
  }
}
