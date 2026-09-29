# Contract: HTTP responses (Workers static assets)

Tests: `tests/unit/site/headers.test.ts`, `csp.test.ts`, `tests/e2e/headers.spec.ts`,
`not-found.spec.ts`, `analytics.spec.ts` — E2E against `wrangler dev`.

## `wrangler.jsonc`

```jsonc
"assets": { "directory": "./dist", "not_found_handling": "404-page" }
```

## Status

- Built paths → 200. Unknown paths (including `/drift/2025/x/`, `/convergence/`, `/news/`,
  `/topic/x/`, `/author/x/`, and not-yet-built nav destinations) → **404** with the not-found page
  body.

## Headers on every response (`public/_headers`, `/*`)

| Header | Value |
|---|---|
| `X-Robots-Tag` | `noindex` |
| `Content-Security-Policy` | `frame-ancestors 'none'; object-src 'none'; base-uri 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `X-Frame-Options` | `DENY` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Strict-Transport-Security` | `max-age=31536000` |
| `Set-Cookie` | never present |

## Meta CSP on every HTML page (Astro `security.csp`)

Must contain: `default-src 'self'`; `script-src 'self' https://static.cloudflareinsights.com`
plus the theme-init hash and Astro's generated hashes; `style-src 'self'` plus generated hashes;
`img-src 'self' data:`; `font-src 'self'`; `connect-src 'self' https://cloudflareinsights.com`;
`object-src 'none'`; `base-uri 'self'`; `form-action 'self'`.

Must not contain: `unsafe-inline`, `unsafe-eval`, `web3forms`, `jsdelivr`, `supabase`, `https:`
as a bare scheme source.

## Statistics resilience

- A page with the Cloudflare beacon tag injected and its request aborted loads with no page
  errors, no CSP violation, and working navigation/theme switch.
