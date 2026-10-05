// The origin check every API endpoint shares: HTTPS only (plain http on localhost for local
// development), `Origin` equal to the request's own origin, and `Sec-Fetch-Site`, when the
// browser sends it, `same-origin`.

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

/** The scheme rule: https, or plain http on localhost for local development. */
export function isSecureRequest(url: URL): boolean {
  return url.protocol === "https:" || (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname));
}

export function isSameOriginRequest(request: Request, url: URL): boolean {
  if (!isSecureRequest(url)) return false;
  if (request.headers.get("Origin") !== url.origin) return false;
  const site = request.headers.get("Sec-Fetch-Site");
  return site === null || site === "same-origin";
}
