# Contract: the site check (sitemap and internal links)

## Module: `scripts/site-check/crawl.ts`

```ts
export function crawl(options: CrawlOptions): Promise<CrawlResult>;
export function parseSitemap(xml: string): string[];           // <loc> values, in order
export function extractLinks(html: string): string[];          // raw href values of <a> elements
export function formatFailures(result: CrawlResult): string[]; // one plain line per failure
```

The types `CrawlOptions`, `CrawlResult` and `CrawlFailure` are defined in data-model.md.

**Algorithm**

1. Fetch `<base>/robots.txt`. Read the `Sitemap:` line. Fall back to `/sitemap-index.xml` if the
   line is missing.
2. Fetch the sitemap index. Each child `<loc>` is mapped onto `base` (path kept), fetched and
   parsed. A sitemap that does not return 200 is a `sitemap` failure.
3. Every page `<loc>` must have the same origin, which becomes the `declaredOrigin`.
   - If the origins differ, that is an `origin` failure.
   - If `expectOrigin` is set and differs from the declared origin, that is an `origin`
     failure (`sitemap names https://x, expected https://y`).
4. Each page is fetched at `base + path`, and must return 200 with no redirect. Otherwise it is
   a `page` failure (`returned 404` or `redirected to /x/`). With `expectNoindex`, each page
   response must have `X-Robots-Tag` containing `noindex`. Otherwise it is a `noindex` failure.
5. When `checkLinks` is set, the crawler extracts the links from every 200 page and resolves
   each one against the page URL.
   - **Kept**: links whose origin is `base` or `declaredOrigin`.
   - **Dropped**: the fragment.
   - **Ignored**: `mailto:`, `tel:`, `javascript:`, other origins, and links that are only a
     fragment.

   Each unique path is checked once, following same-site redirects for up to 5 hops. A link
   that does not end in 200 is a `link` failure, listing every linking page.
6. At most `concurrency` requests run at a time (default 4). A 5xx or network error is retried
   once, with a 1-second pause before the retry.

## CLI: `pnpm run site:check -- <flags>` (`node scripts/site-check/cli.ts`)

| Flag | Meaning |
|---|---|
| `--base <url>` | Required. The origin to request |
| `--expect-origin <url>` | The sitemap must declare this origin |
| `--expect-noindex` | Every page response must send `X-Robots-Tag: noindex` |
| `--no-links` | Check the sitemap only |
| `--json` | Print the `CrawlResult` as JSON instead of lines |

Output: a heading line (`Checked <p> pages and <l> links on <base>`), then one line per failure,
for example `link  /blog/missing/  returned 404  (linked from /blog/, /about/)`.

Exit codes:

| Code | Meaning |
|---|---|
| 0 | No failures |
| 1 | One or more failures |
| 2 | Bad arguments, or the base could not be reached at all |

The CLI never prints an environment value.

## CI step: `node scripts/site-check/preview.ts`

The step goes in `.github/workflows/ci.yml`, job `verify`, after `Run the verify gate`:

```yaml
- name: Check the preview's sitemap and links
  if: github.event_name == 'pull_request' && steps.changes.outputs.full != 'false'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    HEAD_SHA: ${{ github.event.pull_request.head.sha }}
    HEAD_REF: ${{ github.head_ref }}
  run: node scripts/site-check/preview.ts
```

The job adds `checks: read` under `permissions` and keeps `contents: read`.

**Behaviour**

1. **Wait for the preview build.** Poll `GET repos/{repo}/commits/{HEAD_SHA}/check-runs?check_name=Workers Builds: dcc-web-preview`
   every 20 seconds for up to 20 minutes, until the run's `status` is `completed`.
   - `conclusion: success`: continue.
   - Any other conclusion: fail with
     `The preview build for <sha> finished as <conclusion>; see <details_url>.`
   - No run within 20 minutes: fail with
     `No "Workers Builds: dcc-web-preview" check run appeared for <sha> within 20 minutes. Re-run this job once the preview build has reported.`
2. **Build the preview address.** It is `https://<previewAlias(HEAD_REF)>-<previewWorkerName>.<workersSubdomain>.workers.dev`,
   with the worker name and subdomain read from `setup/config.json`. If no alias can be
   derived, fail with a plain message.
3. **Crawl.** Run with `base = expectOrigin = <preview address>`, `expectNoindex: true` and
   `checkLinks: true`.
4. **Report.** On failure:
   - print each line from `formatFailures`;
   - emit one `::error title=Site check::<line>` annotation per failure;
   - append a Markdown table (`Kind | Address | Problem | Linked from`) to `$GITHUB_STEP_SUMMARY`;
   - exit 1.

   On success, append `Preview site check passed: <p> pages, <l> links.` to the summary.

**Test seams**: `preview.ts` exports `waitForPreview(deps)` and `previewOrigin(env, config)`.
`deps` gives injected `getCheckRuns`, `sleep` and `now` functions, so unit tests run without a
network or real time.

## Local layer: `tests/e2e/site-links.spec.ts`

This spec is in the Playwright `e2e` project, which runs against `wrangler dev` at
`http://127.0.0.1:4321`. It calls `crawl()` with `base: "http://127.0.0.1:4321"` and
`checkLinks: true`, using a fetcher built on Playwright's `request` context with
`maxRedirects: 0`, and expects `failures` to be `[]`. A local build declares
`https://doncoleman.ca` (the fallback origin), and the crawler maps that onto the base. There is
no `expectNoindex`: a localhost host does not match the host-scoped `_headers` rules.
