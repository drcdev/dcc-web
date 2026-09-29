# Contract: Head metadata, sitemap and crawler instructions

Tests: `tests/component/Seo.test.ts`, `tests/unit/site/sitemap.test.ts`, `tests/e2e/seo.spec.ts`.
`{origin}` is the build's resolved origin ([site-origin.md](./site-origin.md)).

## Every page

| Element | Value |
|---|---|
| `<title>` | `{title} · Don Coleman`, or `Don Coleman` on home; unique across pages |
| `meta[name=description]` | page value or site default; non-empty |
| `link[rel=canonical]` | `{origin}{pathname}` (omitted on the not-found page) |
| `meta[name=robots]` | `noindex` (every page, this feature) |
| `meta[property=og:title]` | same as page title without suffix, or site name |
| `meta[property=og:description]` | same as description |
| `meta[property=og:type]` | `website` (default) |
| `meta[property=og:url]` | same as canonical (omitted on not-found) |
| `meta[property=og:site_name]` | `Don Coleman` |
| `meta[property=og:image]` | absolute `{origin}/og-default.png` unless overridden |
| `meta[property=og:image:alt]` | non-empty |
| `meta[property=og:locale]` | `en_CA` |
| `meta[name=twitter:card]` | `summary_large_image` |
| `link[rel=sitemap]` | `/sitemap-index.xml` |
| `meta[http-equiv=content-security-policy]` | Astro-generated ([http-responses.md](./http-responses.md)) |

## `/sitemap-index.xml` and `/sitemap-0.xml`

- Every built public page appears as `{origin}{path}`; the not-found page never appears.

## `/robots.txt`

```
User-agent: *
Allow: /

Sitemap: {origin}/sitemap-index.xml
```

No `Disallow` line.
