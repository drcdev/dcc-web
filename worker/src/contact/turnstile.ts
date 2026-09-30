// Server-side Turnstile verification (research R6). Fails closed: only an explicit, matching
// success is accepted, and an unreachable or failing siteverify is an error the caller turns
// into 503 (FR-012a).

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TURNSTILE_ACTION = "contact";
export const TOKEN_MAX = 2048;
const TIMEOUT_MS = 5000;

export class TurnstileUnavailableError extends Error {
  override name = "TurnstileUnavailableError";
}

interface SiteverifyResponse {
  success?: boolean;
  action?: string;
  hostname?: string;
  metadata?: { result_with_testing_key?: boolean };
}

export interface VerifyInput {
  secret: string;
  token: string;
  remoteIp: string | null;
  idempotencyKey: string;
  hostname: string;
}

/** True only for a successful verdict for this action on this host. Throws when unavailable. */
export async function verifyTurnstile(input: VerifyInput): Promise<boolean> {
  const form = new URLSearchParams({
    secret: input.secret,
    response: input.token,
    idempotency_key: input.idempotencyKey,
  });
  if (input.remoteIp) form.set("remoteip", input.remoteIp);

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new TurnstileUnavailableError();
  }
  if (!response.ok) throw new TurnstileUnavailableError();

  let result: SiteverifyResponse;
  try {
    result = (await response.json()) as SiteverifyResponse;
  } catch {
    throw new TurnstileUnavailableError();
  }
  // Cloudflare's documented test secrets answer with a fixed hostname (example.com) and no
  // action, and say so in the metadata. Only a real siteverify answer can carry that flag.
  if (result.metadata?.result_with_testing_key === true) return result.success === true;
  return result.success === true && result.action === TURNSTILE_ACTION && result.hostname === input.hostname;
}
