# Quickstart: validate the site foundation

**Feature**: `002-site-foundation` | **Plan**: [plan.md](./plan.md)

This is a run-and-check guide. Contracts hold the exact expectations; this page says how to see
them working.

## Prerequisites

- Node 24, pnpm (version in `package.json` `packageManager`), `gh` signed in — as in
  `docs/setup.md` item 1.
- `pnpm install --frozen-lockfile` and `pnpm exec playwright install chromium`.
- For reading the old theme: `gh repo clone drcdev/flux .reference/flux -- --depth 1`
  (gitignored, read-only).

## 1. Full local gate

```bash
pnpm run verify
```

Expected: every step passes — secrets lint, ESLint, `astro check`, Vitest unit + component tests,
`astro build`, then Playwright projects `e2e`, `a11y`, `budget`, `visual` against `wrangler dev`
([contracts/verify-gate.md](./contracts/verify-gate.md)). On macOS the `visual` project compares
against the `-darwin` baselines.

## 2. Look at it locally

```bash
pnpm run build && pnpm exec wrangler dev --ip 127.0.0.1 --port 4321
```

Open `http://127.0.0.1:4321/` and check:

- Dark theme on first visit. Footer "Theme:" button cycles Dark → Light → Match device → Dark;
  reload and open `/nope/` — the chosen theme shows immediately, no flash.
- Phone width (DevTools, 390 px): links collapse behind "Menu"; Escape closes and returns focus to
  the button. Turn JavaScript off: links show as a wrapping list, no button.
- Tab from the address bar: "Skip to main content" first, then header, main, footer, with a
  visible ring.
- `/services/`, `/drift/2025/anything/`, `/topic/x/` → the not-found page, status 404
  (`curl -sI http://127.0.0.1:4321/drift/2025/x/`).
- `curl -sI http://127.0.0.1:4321/` shows `X-Robots-Tag: noindex`, the CSP header and the other
  headers in [contracts/http-responses.md](./contracts/http-responses.md).
- `http://127.0.0.1:4321/robots.txt` and `/sitemap-index.xml` point at `https://doncoleman.ca`
  (local builds use the fallback origin).

## 3. Compare with the current site

Open `tests/reference/ghost/` (captured with `pnpm run reference:capture` before styling) side
by side with the local site at the same width and theme: colours, type, spacing, header and
footer should match closely; no Subscribe, Account or search buttons.

## 4. Pull request and preview (Don)

1. **One-time Cloudflare setting** (docs/setup.md item 10): Workers & Pages → `dcc-web` →
   Settings → Build → non-production branch deploy command → `pnpm run deploy:preview`. Leave the
   build command (`pnpm run build`) and production deploy command (`pnpm exec wrangler deploy`)
   unchanged. No token or secret is involved.
2. Confirm `setup/config.json` has `workersSubdomain` (public value from any preview URL).
3. Push; the `verify` check runs. On the first run the `visual` project fails until the Linux
   baselines are committed: download them with `gh run download <run-id>`, review the images,
   commit, push.
4. When Workers Builds finishes, open the preview at
   `https://br-002-site-foundation-dcc-web.<workersSubdomain>.workers.dev/`. View source: the
   `canonical`, `og:url` and `/robots.txt` `Sitemap:` line all use that same address.
5. Compare the preview with `tests/reference/ghost/` in both themes at phone and desktop widths.
6. `pnpm setup:check --item workers-builds` reports a successful preview build for the PR.
7. Approve the PR (labelled `major-change`) only after steps 4–5.

## 5. After merge

- Workers Builds deploys `main`; `https://new.doncoleman.ca/` shows the new shell within about
  10 minutes; its canonical uses `https://new.doncoleman.ca`.
- `pnpm setup:check --item review-address-noindex` and `--item web-analytics` still report
  complete (noindex header kept; beacon injected on the main build only).
- Browse a few pages, then check DevTools → Application → Cookies: none set by the site.

## 6. Deliberate failure (SC-008)

On a throwaway branch, break one assertion (for example change a nav label) and push: `verify`
fails, the merge button stays blocked, and nothing reaches `main`.
