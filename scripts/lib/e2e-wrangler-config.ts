// Pure transform from the parsed wrangler.jsonc to the Worker config that `wrangler dev` uses under
// Playwright. It drops three keys, at the top level and in every environment:
// - `$schema`, which only editors read.
// - `ai`, because wrangler runs an `ai` binding through a remote proxy session that needs a
//   Cloudflare login, and a CI or Docker run has none (specs/022 research R12 fallback).
// - `routes`, because `wrangler dev` infers its origin host from the first route and rewrites
//   request URLs to it, which would fail the contact API's same-origin check against the local
//   127.0.0.1 origin the E2E suite uses.
const DROPPED_KEYS = ["$schema", "ai", "routes"] as const;

function withoutDropped(scope: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...scope };
  for (const key of DROPPED_KEYS) delete copy[key];
  return copy;
}

export function toE2eWranglerConfig(config: Record<string, unknown>): Record<string, unknown> {
  const result = withoutDropped(config);
  if (config.env && typeof config.env === "object") {
    result.env = Object.fromEntries(
      Object.entries(config.env as Record<string, Record<string, unknown>>).map(([name, env]) => [
        name,
        withoutDropped(env),
      ]),
    );
  }
  return result;
}
