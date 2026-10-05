// The origin check every API endpoint shares: HTTPS only (plain http on localhost for local
// development), `Origin` equal to the request's own origin, and `Sec-Fetch-Site`, when the
// browser sends it, `same-origin`.

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function isSameOriginRequest(request: Request, url: URL): boolean {
  if (url.protocol !== "https:" && !(url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname))) return false;
  if (request.headers.get("Origin") !== url.origin) return false;
  const site = request.headers.get("Sec-Fetch-Site");
  return site === null || site === "same-origin";
}
