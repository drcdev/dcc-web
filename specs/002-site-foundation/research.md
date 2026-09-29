# Research: Site foundation for doncoleman.ca

**Feature**: `002-site-foundation` | **Date**: 2026-09-28 | **Plan**: [plan.md](./plan.md)

Every Astro decision below was checked against the official Astro docs through the Astro Docs MCP
server (`astro-docs`), as Principle IV and the Development Workflow require; the page each choice
rests on is linked. Cloudflare decisions were checked against developers.cloudflare.com. The Flux
theme was read from a local, read-only clone at `.reference/flux` (gitignored; never imported).

---

## R1. Deployment mechanism: keep Workers Builds (reconciliation)

- **Decision**: Keep the deployment already set up in 001: **Cloudflare Workers Builds**, connected
  to `drcdev/dcc-web`, builds and deploys `main` to production (`pnpm exec wrangler deploy`) and
  every other branch to a preview. GitHub Actions stays the required `verify` check only. No
  Cloudflare deploy secret is added to GitHub.
- **Reconciliation**: The feature prompt asks for "Wrangler from GitHub Actions with
  `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets". The setup already in place
  (`docs/setup.md` items 7, 10 and 15; `scripts/setup-check/checks/pipeline-secrets.ts` expects
  **zero** Actions secrets; `workers-builds.ts` confirms Workers Builds runs on `main` and on pull
  requests) uses Workers Builds instead. FR-031 says to build on that setup, not recreate it, and
  Principle IV prefers the platform's own CI/CD over a custom Actions deploy job. Workers Builds is
  also what the Astro deploy guide documents for CI/CD. Production is gated because `main` only
  accepts merges whose `verify` and `major-change-approval` checks passed (strict ruleset,
  `setup/github-ruleset.json`), so Workers Builds only ever deploys code that passed the gate.
- **Residual gap, stated plainly**: Workers Builds cannot wait for a GitHub check on the merge
  commit itself; the protection is that the merged head was verified and required to be up to
  date with `main` (strict checks). This is the same arrangement 001 accepted (001 research R4).
- **Docs**: [Deploy your Astro Site to Cloudflare — How to deploy with CI/CD](https://docs.astro.build/en/guides/deploy/cloudflare/);
  Cloudflare [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
- **Alternatives rejected**: GitHub Actions + `wrangler deploy` with a stored API token (adds two
  secrets the setup check forbids, duplicates Workers Builds, and adds a credential to rotate).

## R2. How a build learns its own served address (FR-017, FR-018)

- **What Workers Builds provides** (Cloudflare docs, Workers Builds configuration): `CI=true`,
  `WORKERS_CI=1`, `WORKERS_CI_BUILD_UUID`, `WORKERS_CI_COMMIT_SHA`, `WORKERS_CI_BRANCH`. It does
  **not** provide the deployment URL or the account's `workers.dev` subdomain.
- **Preview URL scheme** (Cloudflare docs, Version URLs / Previews): with `preview_urls: true`
  (already in `wrangler.jsonc`) a non-production upload gets
  `https://<version-prefix>-<worker>.<subdomain>.workers.dev`, where the version prefix is only
  known after upload; an **aliased** upload (`wrangler versions upload --preview-alias <alias>`)
  also gets the stable `https://<alias>-<worker>.<subdomain>.workers.dev`. Alias rules: lowercase
  letters, digits and dashes; must start with a letter; alias + worker name ≤ 63 characters.
  Cloudflare does not document any automatic branch-to-alias naming, so the build cannot predict
  the address of today's non-aliased preview upload (001 research R4 set the non-production deploy
  command to plain `pnpm exec wrangler versions upload`).
- **Decision**: make the preview address deterministic from inputs the build already has:
  1. A pure, unit-tested function `resolveSiteOrigin(env, config)` in `src/lib/site-origin.ts`,
     called from `astro.config.mjs` (which, per the Astro docs, reads `process.env`, not
     `import.meta.env`) to set Astro's `site`:
     | Condition | Origin |
     |---|---|
     | `WORKERS_CI=1` and `WORKERS_CI_BRANCH=main` | `https://` + `reviewHost` from `setup/config.json` (`https://new.doncoleman.ca`) |
     | `WORKERS_CI=1`, other branch, and `workersSubdomain` recorded in `setup/config.json` | `https://<alias>-dcc-web.<workersSubdomain>.workers.dev`, where `alias = previewAlias(WORKERS_CI_BRANCH)` |
     | anything else (local builds, GitHub Actions `verify`, missing/invalid config, branch that cannot produce a valid alias) | `https://doncoleman.ca` (the spec's fallback) |
  2. `previewAlias(branch)`: lowercase; every run of characters outside `[a-z0-9]` becomes one `-`;
     trim leading/trailing `-`; prefix `br-` if it does not start with a letter (Spec Kit branches
     start with digits, e.g. `002-site-foundation` → `br-002-site-foundation`); truncate to
     `63 - len("-dcc-web") = 55` characters and trim a trailing `-`; empty → no alias (fallback).
  3. A repository script `pnpm run deploy:preview` (`scripts/deploy/preview.ts`) runs
     `wrangler versions upload --preview-alias <previewAlias(WORKERS_CI_BRANCH)>`, using the same
     function, so build and upload always agree.
  4. `setup/config.json` gains `workersSubdomain` (public: it appears in every preview URL). The
     implementing agent reads it from the Workers Builds check run's preview link on the pull
     request (`gh api .../check-runs`, `details_url`/output), never from a secret.
- **One dashboard change for Don** (documented in `docs/setup.md` item 10 and the quickstart): in
  Workers & Pages → `dcc-web` → Settings → Build, set the **non-production branch deploy command**
  to `pnpm run deploy:preview`. Production stays `pnpm exec wrangler deploy`; build command stays
  `pnpm run build`. No secret or token is involved.
- **Precise fallback behaviour**: whenever the origin is not determinable — any build outside
  Workers Builds, a missing `workersSubdomain`, or a branch whose alias would be empty — every
  canonical link, `og:url`, sitemap `<loc>` and the `Sitemap:` line in `robots.txt` use
  `https://doncoleman.ca`. Until Don changes the non-production deploy command, preview builds
  would already compute the alias address while being uploaded without the alias; the quickstart
  therefore checks, on the first preview after the change, that the page's canonical equals the
  address it is served from. Because the site is `noindex` everywhere (FR-019) a wrong canonical
  on a preview has no search impact, only a sharing-preview one.
- **Domain switch note**: at the domain switch, `reviewHost` (or a dedicated production host
  value) changes from `new.doncoleman.ca` to `doncoleman.ca` — one committed value — together
  with removing `noindex`. This is slightly more than the spec's assumption ("no metadata change
  beyond serving the site at doncoleman.ca"), because a build cannot see which custom domains are
  attached to the Worker. Recorded as part of the existing domain-switch follow-up.
- **Docs**: [Configuration reference — `site`](https://docs.astro.build/en/reference/configuration-reference/#site);
  [Using environment variables — In the Astro config file](https://docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file);
  Cloudflare [Version URLs / preview aliases](https://developers.cloudflare.com/workers/configuration/previews/).
- **Alternatives rejected**: relative canonicals (invalid for `og:url` and sitemaps); a runtime
  Worker rewriting URLs (breaks "static by default", Principle V, and adds a Worker script);
  Cloudflare's open-beta `wrangler preview` command (same URL shape, but beta; can be adopted later
  without changing the function's output format); asking Don for a Workers Builds build variable
  (a second dashboard setting with no benefit over the committed, public subdomain).

## R3. Styling: Tailwind v4 via `@tailwindcss/vite`, Flux palettes ported as-is

- **Decision**: Add Tailwind 4 with `pnpm astro add tailwind` (installs `tailwindcss` and
  `@tailwindcss/vite`, registers the Vite plugin, creates `src/styles/global.css`). Add
  `@tailwindcss/typography` because Flux's `.prose-accent` overrides the Typography plugin's
  `--tw-prose-*` variables and has no effect without it. `global.css` is imported once by the base
  layout.
- **Port** (from `.reference/flux/assets/css/screen.css`, copied by hand, not imported):
  - The seven `@theme` palettes (dusk, rust, sage, lavender, mist, sand, mauve; 50–950 plus
    `BASE`) exactly as written, keeping the `hsl(from var(--color-X-BASE) h s N%)` derivation so
    that changing one `BASE` value updates the palette (FR-002). Mist keeps its own lightness steps.
  - `accent-*`: Flux derives it from Ghost's `--ghost-accent-color`; here a fixed
    `--color-accent-BASE: #d68844` with the same eleven derived shades (FR-003).
  - `--gh-font-body` / `--gh-font-heading` become `--font-body` / `--font-heading` tokens set to a
    system font stack (Tailwind's default `--font-sans` stack); body elements and headings use them
    exactly as Flux's two font rules do. No web fonts (FR-003). Follow-up: when the real Ghost
    fonts are confirmed, self-host them with Astro's built-in fonts API
    ([Using custom fonts](https://docs.astro.build/en/guides/fonts/)).
  - `@custom-variant dark (&:where(.dark, .dark *));` unchanged, plus a new
    `@custom-variant js (&:where(.js, .js *));` for progressive enhancement (R6).
  - `.prose-accent` light/dark variables, heading colours (H1/H2 rust, H3 sage, H4 lavender,
    H5/H6), `.table-wrapper` rules, and the `a:focus-visible, button:focus-visible` focus ring —
    as-is. Focus ring also gets a `forced-colors` fallback (`outline-color: CanvasText`).
  - Not ported here (owned by Blog/Pages): `kg-*` rules, Prism rules, line numbers, toolbar,
    newsletter rules.
- **Accessibility adjustments**: If an axe contrast check fails on a ported colour pairing, the
  implementer moves that one utility to the nearest shade of the same palette that passes AA and
  records it in `docs/design-source.md` under "Accessibility adjustments" (palette tokens
  themselves never change). This keeps FR-001 and FR-020 compatible and visible to Don's review.
- **Docs**: [Styles and CSS — Tailwind](https://docs.astro.build/en/guides/styling/#tailwind);
  [Style rendered Markdown with Tailwind Typography](https://docs.astro.build/en/recipes/tailwind-rendered-markdown/).
- **First-party check**: Tailwind is named in the constitution's technology constraints; Astro's
  docs name the Vite plugin as the supported path for Tailwind 4 (the `@astrojs/tailwind`
  integration is legacy/Tailwind 3 only).

## R4. Layout, header, footer, navigation (port of default/layout-header/layout-footer/navigation.hbs)

- **Decision**: `src/layouts/BaseLayout.astro` (html `lang="en"`, `class="scroll-smooth"`; body
  `bg-white dark:bg-dusk-BASE antialiased`), `src/components/SkipLink.astro`,
  `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`,
  `src/components/ThemeToggle.astro`, `src/components/Seo.astro`. `main#main` keeps Flux's
  `container mx-auto p-4 mt-4`. Header and footer classes are ported from the partials with the
  Ghost-only pieces removed: search button, Subscribe/Account buttons (header and footer), portal
  links, `{{ghost_head}}`/`{{ghost_foot}}`, logo image (site has none), Facebook/X links.
- **Navigation data** lives in one typed module `src/config/navigation.ts`: primary
  `Home /`, `Services /services/`, `Speaking /speaking/`, `Writing /writing/`,
  `Projects /projects/`, `About /about/`, `Contact /contact/`; footer
  `/privacy-policy/` "Privacy policy", `/terms-of-use/` "Terms of use", `/technology/`
  "Technology"; social GitHub `https://github.com/drcdev`, LinkedIn
  `https://www.linkedin.com/in/drcdev`. Final addresses are used now (FR-006); until later
  features exist they return the not-found page. Automated link checks treat these as known
  future destinations via an explicit allow-list exported from the same module
  (`futureDestinations`), so a typo in any other link still fails.
- **Current page** (FR-009): `aria-current="page"` plus a visual style (rust text and underline),
  computed from `Astro.url.pathname` with trailing-slash normalisation.
- **Copyright**: "© {build year} Don Coleman. All rights reserved." (year from `new Date()` at
  build; spec assumption "the year the site is built").
- **Docs**: [Layouts](https://docs.astro.build/en/basics/layouts/);
  [Components](https://docs.astro.build/en/basics/astro-components/).

## R5. Theme switch without a flash (port of theme-toggle.js + ui-theme-toggle.hbs)

- **Decision**:
  - **Before paint**: a tiny plain-JS file `src/scripts/theme-init.js` rendered once in `<head>`
    as `<script is:inline set:html={themeInit}>` (content imported with `?raw`), before the
    stylesheet link. It reads `localStorage["color-theme"]` inside `try`, treats anything other
    than `dark|light|system` as no choice (dark), resolves `system` with
    `matchMedia('(prefers-color-scheme: dark)')`, toggles `dark` on `<html>`, and adds the `js`
    class (R6). It does **not** write storage on first visit (Flux wrote `"dark"`; the visible
    behaviour is identical and the spec defines "absent means dark").
  - **Toggle**: `ThemeToggle.astro` in the footer, with a bundled `<script>` (Astro-processed,
    TypeScript) importing pure helpers from `src/lib/theme.ts` (`parseTheme`, `nextTheme`
    dark→light→system→dark, `isDark(choice, prefersDark)`). The button shows the sun, moon or
    "System" state as Flux does; its accessible name is "Theme: Dark" / "Theme: Light" /
    "Theme: Match device", with visible "Theme:" label text as in Flux, and a polite live region
    announces changes. `aria-pressed` is dropped (a three-state cycle is not a pressed/unpressed
    toggle). In `system` mode a `matchMedia` change listener re-applies the theme. Writes are
    wrapped in `try`; if storage fails, the theme still changes for the page (FR-015).
  - Without JavaScript the toggle is hidden (`hidden js:inline-flex`) and the page is dark
    (`<html class="dark">` is the server-rendered default, so no-JS also gets dark).
- **Why inline**: Astro-processed scripts are `type="module"` (deferred), so they run after first
  paint; only an `is:inline` head script can set the class before paint
  ([Scripts and event handling — Script processing / Unprocessed scripts](https://docs.astro.build/en/guides/client-side-scripts/#script-processing);
  [Template directives — `is:inline`](https://docs.astro.build/en/reference/directives-reference/#isinline)).
- **First-party check**: Astro has no built-in theme switcher; view transitions are not used
  (Astro CSP does not support `<ClientRouter />`, R8).

## R6. Mobile menu: progressive enhancement (port of navigation-toggle.js)

- **Decision**: one `<ul>` of links, rendered visible and wrapping by default. The head init
  script adds `js` to `<html>` before paint; CSS under `js:max-md:` collapses the list and shows
  the menu button, so there is no layout shift when script arrives. A bundled script in
  `SiteHeader.astro` wires the button: `aria-expanded`, `aria-controls`, label "Menu"; opens and
  closes on activation; closes on Escape (focus returns to the button), on choosing a link, on a
  click outside (Flux behaviour), when focus leaves the nav, and when the viewport crosses the
  `md` breakpoint (`matchMedia('(min-width: 48rem)')` change resets to closed). Transitions are
  wrapped in `motion-safe:`.
- **Native HTML considered first** (Principle IV and the prompt): `<details>/<summary>` and the
  Popover API both work without JavaScript, but both keep the links collapsed behind a control
  when script is off, which the clarified spec forbids ("without script the links show as a plain
  wrapping list and no menu button"). A small script is therefore the smallest option that meets
  FR-007.
- **Docs**: [Scripts and event handling](https://docs.astro.build/en/guides/client-side-scripts/).

## R7. Not-found page (port of error.hbs)

- **Decision**: `src/pages/404.astro` using `BaseLayout` — heading "Page not found", plain
  explanation (including that older blog addresses have moved), a link home and the site
  navigation (already in the header, plus a short in-page list of the main sections). It is
  `noindex` and has no canonical. `wrangler.jsonc` gains `"not_found_handling": "404-page"` so
  Workers static assets serve `404.html` with status 404 for any unknown path, including the old
  `/drift/…`, `/convergence/…`, `/news/…`, `/topic/…`, `/author/…` addresses.
- **Docs**: [Pages — Custom 404 Error Page](https://docs.astro.build/en/basics/astro-pages/#custom-404-error-page);
  [Deploy to Cloudflare — Troubleshooting: 404 behavior](https://docs.astro.build/en/guides/deploy/cloudflare/#troubleshooting).

## R8. Security headers and content security policy (FR-024)

- **Decision**: split the policy between Astro's first-party CSP feature and Cloudflare's
  `_headers`, because each covers what the other cannot:
  - **Astro `security.csp`** (stable since Astro 6) emits a `<meta http-equiv="content-security-policy">`
    with generated hashes for Astro's own scripts and styles. Configured with:
    `scriptDirective.resources: ["'self'", "https://static.cloudflareinsights.com"]`,
    `scriptDirective.hashes: [<sha256 of src/scripts/theme-init.js>]` (computed in
    `astro.config.mjs` from the file; `is:inline` scripts are not hashed automatically),
    `styleDirective.resources: ["'self'"]`, and `directives: ["default-src 'self'",
    "img-src 'self' data:", "font-src 'self'", "connect-src 'self' https://cloudflareinsights.com",
    "object-src 'none'", "base-uri 'self'", "form-action 'self'", "upgrade-insecure-requests"]`.
  - **`public/_headers`** (extends the existing file; `/*` rule): keeps `X-Robots-Tag: noindex`,
    adds `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'`
    (directives a meta tag cannot carry, and no `default-src`/`script-src` so it cannot block the
    hashed inline script — both policies are enforced together),
    `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
    `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`,
    `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`,
    `Strict-Transport-Security: max-age=31536000` (no `includeSubDomains`/`preload`: the zone
    still serves Ghost and mail-related hosts).
- **Tightening versus Flux** (`default.hbs` meta CSP): removed `https://web3forms.com`,
  `https://api.web3forms.com` (old form service), `https://cdn.jsdelivr.net` (public script CDN,
  both `script-src` and `style-src`), the Supabase URL in `connect-src` (old database service),
  `'unsafe-inline'` in `style-src`, and the blanket `img-src https:`. Kept: `'self'`,
  `https://static.cloudflareinsights.com` (beacon script) and `https://cloudflareinsights.com`
  (beacon reporting).
- **Why not `_headers` alone**: the pre-paint theme script is inline; a header-only policy would
  need a hand-maintained hash in a static file or `'unsafe-inline'`. Astro's feature computes the
  hashes for everything it emits at build time.
- **Forward note for the Blog feature**: Astro's docs say Shiki's inline `style` attributes do not
  work with Astro CSP by default; since Astro 7.1 this is handled with
  `styleDirective.resources: [{ resource: "'unsafe-inline'", kind: "attribute" }]`, or by using
  Shiki's class-based output. Recorded in `docs/design-source.md` against the Shiki row.
- **Docs**: [Configuration reference — `security.csp`](https://docs.astro.build/en/reference/configuration-reference/#securitycsp);
  [@astrojs/cloudflare — Cloudflare Platform: Headers](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-platform);
  Cloudflare [Static assets headers](https://developers.cloudflare.com/workers/static-assets/headers/).
- **Meta placement (observed in the Phase 8 build)**: Astro injects the policy `<meta>` where it
  injects head content, just before the stylesheet, so the pre-paint theme script (which must run
  before the stylesheet, FR-013) is the one script ahead of it. Its hash stays in `script-src` so
  it remains valid wherever the tag lands; every other script follows the policy. Only static,
  escaped build output precedes it. `tests/e2e/headers.spec.ts` pins this ordering.
- **Verified locally**: `wrangler dev` (already a devDependency) serves `dist/` offline and applies
  `_headers` (`x-robots-tag: noindex` observed on `/` and on a 404 during planning).

## R9. Search and sharing metadata; sitemap; crawler instructions (FR-017–FR-019)

- **Sitemap**: official `@astrojs/sitemap` integration with `site` from R2 and
  `filter: (page) => !new URL(page).pathname.startsWith("/404")`. `<link rel="sitemap"
  href="/sitemap-index.xml">` in the head.
  ([@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/))
- **robots.txt**: generated by a static endpoint `src/pages/robots.txt.ts` exactly as the sitemap
  guide shows, so the `Sitemap:` line uses the same `site`: `User-agent: *`, `Allow: /`,
  `Sitemap: <origin>/sitemap-index.xml`. No `Disallow` (001's runbook warns a crawl block would
  hide the noindex signal).
- **Metadata**: a small first-party component `src/components/Seo.astro` rather than a
  third-party package (Principle IV; Astro has no official SEO integration, and a package adds a
  dependency for ~15 tags). Renders `<title>` ("{page} · Don Coleman", home "Don Coleman"),
  `meta description`, `link rel=canonical` (`new URL(Astro.url.pathname, Astro.site)`),
  `meta robots` (`noindex` on every page until the domain switch; FR-019 — the header already
  covers non-HTML files), Open Graph `og:title`, `og:description`, `og:type` (`website`),
  `og:url`, `og:site_name`, `og:image` (absolute), `og:image:alt`, `og:locale` `en_CA`, and
  `twitter:card` `summary_large_image`. Defaults live in `src/config/site.ts`; each page may
  override. Title uniqueness is enforced by an E2E test over all built pages.
- **Default sharing image**: `public/og-default.png` (1200×630), rendered once from a small HTML
  template in the Flux colours (dusk background, rust name) by a committed Playwright script
  `scripts/og-image/render.ts`, with alt text "Don Coleman". Replaceable later without a spec
  change.
- **Docs**: [Configuration reference — `site`](https://docs.astro.build/en/reference/configuration-reference/#site);
  [@astrojs/sitemap — Usage / Sitemap discovery](https://docs.astro.build/en/guides/integrations-guide/sitemap/#usage);
  [Using environment variables — Default environment variables (`import.meta.env.SITE`)](https://docs.astro.build/en/guides/environment-variables/).

## R10. Visitor statistics (FR-025, FR-026)

- **Decision**: no code. Cloudflare Web Analytics automatic setup (setup item 18) injects the
  beacon at the edge for `new.doncoleman.ca` only, so only the main build is counted and previews
  on `*.workers.dev` are not. The repository contains no analytics script or token. The CSP
  allows the beacon (R8). Tests: a CSP test asserts both beacon hosts are allowed; an E2E test
  injects the beacon tag into a served page via `page.route`, aborts the beacon request, and
  asserts no page errors, no CSP violations for allowed hosts, and unchanged navigation; a cookie
  test asserts `context.cookies()` is empty after browsing (SC-009).
- **Cost**: Web Analytics is free. $0.

## R11. Test stack and layers (Principle I)

| Layer | Tool | Location | What it proves |
|---|---|---|---|
| Unit | Vitest via `getViteConfig()`, `node` env (existing `vitest.config.ts`) | `tests/unit/site/*.test.ts` (+ `tests/unit/ci/workflows.test.ts`, `tests/unit/setup/schemas.test.ts`) | config files (`wrangler.jsonc`, `playwright.config.ts`, `vitest.config.ts`, `package.json` scripts, `ci.yml`), `astro.config.mjs` `site` per environment, `deploy:preview` arguments, a build with the main-branch and preview environments (noindex, one origin), design tokens, the committed reference-screenshot set, `resolveSiteOrigin`, `previewAlias`, theme helpers, navigation data and current-page logic, `_headers` content, CSP config (hash matches `theme-init.js`, forbidden hosts absent), sitemap filter, `docs/design-source.md` required content, `theme-init.js` behaviour in a stubbed `document`/`localStorage` |
| Component | Astro Container API (`experimental_AstroContainer`, `renderToString`) in Vitest `node` env | `tests/component/*.test.ts` | Header, Footer, SkipLink, ThemeToggle, Seo, BaseLayout and 404 markup contracts |
| E2E | Playwright (Chromium) against `wrangler dev` serving `dist/` | `tests/e2e/*.spec.ts` | Shell journeys, mobile menu, theme first paint, not-found status, metadata, sitemap/robots, headers, statistics resilience, cookies, no-JS |
| Accessibility | `@axe-core/playwright` (already installed), WCAG 2.0/2.1/2.2 A+AA tags | `tests/e2e/a11y.spec.ts` | Every template (home, not-found) × phone/desktop × dark/light, plus menu-open state and JavaScript disabled at phone width; zero violations; plus forced-colours, reduced-motion, reflow (320 px, 200 % zoom) and text-spacing checks. Written before any template so it is seen failing first |
| Performance budget | Playwright + Chrome DevTools Protocol throttling (no new dependency) | `tests/e2e/budget.spec.ts` | LCP, CLS, JS bytes, total bytes, long tasks per template on simulated mobile |
| Visual | Playwright `toHaveScreenshot` (built-in) | `tests/e2e/visual.spec.ts` + committed baselines | Header, footer, open mobile menu (phone), not-found page × phone/desktop × dark/light |

- **E2E server change**: `playwright.config.ts` switches `webServer` from `astro preview` to
  `pnpm exec wrangler dev --ip 127.0.0.1 --port 4321` (Cloudflare's own local runtime, already
  installed), because only it applies `_headers`, `not_found_handling` and 404 status the way
  production does. `WRANGLER_SEND_METRICS=false` is set for the server. This replaces the
  `ASTRO_PREVIEW_BACKGROUND` workaround.
- **Component tests** use Astro's documented Container API; Astro 6+ requires the `node`
  environment, which the existing config already uses
  ([Testing — Vitest and Container API](https://docs.astro.build/en/guides/testing/#vitest-and-container-api);
  [Container API reference](https://docs.astro.build/en/reference/container-reference/);
  [Upgrade to v6 — Container API in client environments](https://docs.astro.build/en/guides/upgrade-to/v6/#changed-astro-components-cannot-be-rendered-in-vitest-client-environments-container-api)).
  The API is marked experimental; tests pin to `renderToString`, the long-standing method.
- **Replaced placeholder tests**: `tests/e2e/placeholder.a11y.spec.ts` and
  `placeholder.budget.spec.ts` assert things this feature deliberately changes (exactly one
  link, no SVG, zero `<script>` elements, 30 KB transfer, CLS exactly 0). They are replaced by the
  new a11y and budget specs, which keep every still-valid assertion (one `main`, one `h1`, heading
  order, `lang`, reflow at 320 px and 200 % zoom, readable without JS, noindex, visible focus) and
  set the new budget from the spec. This is a reviewed part of this major change, not a weakening
  to get a change through (Principle II).

## R12. Performance budget (FR-027, SC-004)

- **Decision**: Playwright-based budget, no new dependency. For each template (home, not-found):
  open a fresh Chromium page, enable CDP `Network.emulateNetworkConditions` (150 ms RTT,
  1.6 Mbps down, 750 kbps up — Lighthouse's mobile "slow 4G") and
  `Emulation.setCPUThrottlingRate` 4, phone viewport 390×844, then measure with
  `PerformanceObserver`: **LCP ≤ 2 500 ms**, **CLS < 0.1** (target 0), total long-task time
  ≤ 200 ms, **JavaScript ≤ 10 KB** transferred, **total ≤ 100 KB** transferred per page load.
  Any breach fails the run.
- **Alternatives**: Lighthouse CI (`@lhci/cli`) is acceptable per the prompt and also $0, but it
  adds a large dependency tree and a second browser harness for the same metrics Chromium exposes
  directly; rejected as not needed. Cloudflare has no first-party build-time performance check
  (Web Analytics reports field data after deploy, not a gate).
- **Cost**: $0 (runs inside the existing CI job).

## R13. Visual checks (FR-005, FR-005a)

- **Reference screenshots of the live Ghost site** (for Don's by-eye comparison): captured
  **before** any styling task by `tests/reference/capture-ghost.spec.ts` with its own config
  `tests/reference/playwright.config.ts` (not part of `verify`, since it depends on a live
  external site), run via `pnpm run reference:capture`. Pages: `https://www.doncoleman.ca/`, the
  first post linked from the home page (matched by `/(drift|convergence|news)/\d{4}/`), and
  `/about/`. Widths: phone 390×844, desktop 1280×800. Themes: `dark` and `light`, set with
  `addInitScript(() => localStorage.setItem("color-theme", …))` (Flux's own key). Full-page PNGs
  saved as `tests/reference/ghost/{home|post|about}-{phone|desktop}-{dark|light}.png` (12 files)
  plus `tests/reference/ghost/README.md` noting capture date and the post URL used.
- **Shell baselines** (automated, FR-005a): `tests/e2e/visual.spec.ts` with
  `expect(locator).toHaveScreenshot()` for header, footer, open mobile menu (phone width — the
  menu does not exist at desktop width), and the full not-found page, at phone 390 and desktop
  1280, in dark and light (14 images). Animations disabled, caret hidden. Baselines are committed
  under Playwright's default `*-snapshots/` folders **per platform** (`-darwin`, `-linux`), since
  system fonts differ by OS: local `verify` on macOS uses the darwin set, CI uses the linux set.
  Linux baselines are produced by CI itself: with `updateSnapshots: "none"` a missing baseline
  fails the test and Playwright writes the rendered image (`*-actual.png`) under `test-results/`; the CI job uploads `tests/e2e/**/*-snapshots/**` and `test-results/` as an artifact on
  failure (`actions/upload-artifact`, pinned SHA); the agent downloads them with
  `gh run download`, reviews and commits. No run can pass without baselines for its platform.
- **Docs**: Playwright visual comparisons (built into `@playwright/test`, already installed).

## R14. CI and the local `verify` mirror (FR-027–FR-030)

- **Decision**: keep the single required job `verify` in `.github/workflows/ci.yml` running
  `pnpm run verify`; add only an `if: failure()` artifact upload of Playwright output. Extend
  `verify` in `package.json`:
  `lint:secrets → lint → typecheck → test (unit + component) → build → test:e2e`, where
  `test:e2e` runs all Playwright projects: `e2e`, `a11y`, `budget`, `visual`. Named convenience
  scripts `test:a11y`, `test:budget`, `test:visual` run one project each; `test:visual:update`
  updates local baselines. `verify` stays the exact local mirror of CI.
- **Why no separate jobs**: one required check name (`verify`) is what the ruleset and the setup
  check expect; splitting would change branch protection (FR-031).

## R15. Icons (Flux `partials/Icons/*`)

- **Decision**: port only what the shell uses — `menu`, `theme/sun`, `theme/moon`,
  `social/github`, `social/linkedin` — as `.svg` files in `src/icons/`, imported as components
  with Astro's built-in SVG support; decorative (`aria-hidden="true"`), with accessible names on
  the surrounding link or button. Flux's `sun.hbs`/`moon.hbs` declare `fill` twice; the port keeps
  `fill="none"` with `stroke="currentColor"` (the rendered result). Other icons are ported by the
  feature that uses them.
- **Docs**: [Images — SVG components](https://docs.astro.build/en/guides/images/#svg-components).

## R16. Dependencies and cost (Principle IX)

| Addition | Kind | Why | First-party? | Monthly cost |
|---|---|---|---|---|
| `tailwindcss`, `@tailwindcss/vite` | dependency | Design system (constitution names Tailwind) | Astro-documented path for Tailwind 4 | $0 |
| `@tailwindcss/typography` | dependency | `.prose-accent` port requires it | Tailwind's official plugin; Astro recipe | $0 |
| `@astrojs/sitemap` | dependency | Sitemap (FR-018) | Official Astro integration | $0 |
| `actions/upload-artifact` (pinned SHA) | CI action | Deliver Linux screenshot baselines/failure evidence | GitHub first-party | $0 |

No new services. Workers Builds (free build minutes), static asset requests (free), GitHub
Actions on a public repository (free) and Cloudflare Web Analytics (free) are unchanged.
**Expected additional monthly cost: $0.** Total stays within the $13 ceiling.

pnpm's `minimumReleaseAge` policy (see `pnpm-workspace.yaml`) may reject a very recent release;
if so, pin to the newest version that satisfies it rather than adding exclusions, unless a
security fix requires otherwise.

## R17. Design source document (FR-032, first task)

- **Decision**: `docs/design-source.md` is written first, with exactly the four required sections
  listed in the plan (how to get Flux; mapping table; what doesn't carry over; current live
  URLs), plus an "Accessibility adjustments" section (empty until R3 needs it). A unit test
  (`tests/unit/site/design-source.test.ts`) is written before the document and asserts every
  mapping row, owner and URL pattern is present (SC-010).
- `.reference/` is gitignored (added during planning) and a unit test asserts that
  `.gitignore` contains it and that nothing under `src/` imports from `.reference` (FR-033).
