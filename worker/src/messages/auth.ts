// Bearer-token check for /api/messages* (contracts/retrieval-api.md). The token is read only
// from the Authorization header. Both sides are hashed to SHA-256 so the constant-time
// comparison always sees equal-length inputs.

const encoder = new TextEncoder();

async function digest(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", encoder.encode(value));
}

/** Extracts the token from `Authorization: Bearer <token>`; null for anything else. */
function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (header === null) return null;
  const match = /^Bearer (.+)$/i.exec(header);
  return match ? match[1] : null;
}

export async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const secret = env.CONTACT_READ_TOKEN;
  const presented = bearerToken(request);
  // Hash even when a side is missing so every refusal takes the same path.
  const expected = await digest(typeof secret === "string" ? secret : "");
  const actual = await digest(presented ?? "");
  const equal = crypto.subtle.timingSafeEqual(expected, actual);
  return equal && typeof secret === "string" && secret.length > 0 && presented !== null;
}
