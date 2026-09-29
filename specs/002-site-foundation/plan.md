# Implementation Plan: Site foundation for doncoleman.ca

**Branch**: `002-site-foundation` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-site-foundation/spec.md`

## Summary

Build the shell every later feature sits in, carrying over the Flux theme's look without its
Ghost-only parts: a base layout with header, seven-link navigation (progressively enhanced mobile
menu), footer with legal/social links and a dark → light → system theme switch applied before
first paint, a not-found page served with a 404 status, per-page search and sharing metadata with
a sitemap and crawler instructions that point at the serving deployment's own address, tightened
security headers, and a written Flux-to-site mapping (`docs/design-source.md`, the first task).
The existing pipeline is extended, not replaced: Cloudflare Workers Builds keeps deploying, the
GitHub Actions `verify` job keeps gating, and `pnpm run verify` grows to cover component tests,
accessibility on every template in both themes, a performance budget and committed screenshot
baselines. Technical detail and sources are in [research.md](./research.md).

**Deployment reconciliation (one paragraph).** The feature prompt describes deploying with
Wrangler from GitHub Actions using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
The setup already completed does something different and better aligned with the constitution:
`docs/setup.md` items 7 and 10 connect Cloudflare **Workers Builds** to the repository (production
from `main`, a preview for every other branch), and item 15 plus
`scripts/setup-check/checks/pipeline-secrets.ts` require **zero** GitHub Actions secrets. FR-031
tells this feature to build on that setup, and Principle IV prefers Cloudflare's own CI/CD over a
custom deploy job, so this plan keeps Workers Builds as the only deploy step, keeps the CI
workflow's `verify` job as the required check, and adds no deploy secrets. Production is gated
because `main` only accepts strict, up-to-date merges that passed `verify` and
`major-change-approval`. The one change on the Cloudflare side is the non-production deploy
command (`pnpm run deploy:preview`, which uploads with a branch-derived preview alias) so that a
preview build can know its own address (R1, R2).

## Technical Context

**Language/Version**: TypeScript 6.0 (strict, `astro/tsconfigs/strict`), Node 24, Astro 7.3.5
(static output)

**Primary Dependencies**: `astro` (existing); new: `tailwindcss` + `@tailwindcss/vite` (Tailwind
4 via Vite plugin), `@tailwindcss/typography`, `@astrojs/sitemap`. Existing dev tooling reused:
`wrangler`, `@playwright/test`, `@axe-core/playwright`, `vitest`, `@astrojs/check`, ESLint,
secretlint.

**Storage**: None server-side. Visitor theme choice in the visitor's own `localStorage`
(`color-theme`).

**Testing**: Vitest (unit; component tests through the Astro Container API), Playwright
(Chromium) E2E against `wrangler dev` serving `dist/`, `@axe-core/playwright` accessibility,
Playwright + CDP performance budget, Playwright `toHaveScreenshot` visual baselines.

**Target Platform**: Cloudflare Workers static assets (`wrangler.jsonc`, `assets.directory
./dist`), built and deployed by Workers Builds; modern evergreen browsers; works without
JavaScript.

**Project Type**: Static website (single Astro project at repository root).

**Performance Goals**: Per template on simulated mobile (slow 4G, 4× CPU): LCP ≤ 2.5 s, CLS < 0.1,
long tasks ≤ 200 ms total, JS ≤ 10 KB, total transfer ≤ 100 KB (R12).

**Constraints**: WCAG 2.2 AA in both themes; no horizontal scroll 320 px → wide; reduced motion
respected; no web fonts; script only for theme-before-paint, theme switch and menu collapse; no
cookies; every page prerendered; CSP allows only self and the Cloudflare Web Analytics beacon;
every deployment `noindex`; monthly cost unchanged ($0 added).

**Scale/Scope**: 2 page templates now (placeholder home, not-found) + `robots.txt` and sitemap;
~8 components; 7 primary + 3 footer + 2 social links; ~12 Ghost reference images; 14 shell
baseline images per platform.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* — **Result: PASS**
(before research and after design). No violations; Complexity Tracking is empty.

| Principle | How this plan complies |
|---|---|
| **I. Test-First** | Every task's tests are written and seen failing first. Explicit layers (R11): **unit** (`tests/unit/site/`: origin resolver, preview alias, theme logic, nav data, `_headers`, CSP config, sitemap filter, design-source doc content, theme-init script), **component** (`tests/component/`: Astro Container API for SkipLink, SiteHeader, SiteFooter, ThemeToggle, Seo, BaseLayout, 404), **E2E** (`tests/e2e/`: shell, mobile menu, theme first paint, not-found, SEO/sitemap/robots, headers/CSP, statistics resilience, cookies, no-JS), **accessibility** (axe on every template × both themes × both widths + menu open), **performance budget**, **visual baselines**. The contact-API integration layer does not apply (no API in this feature). Test tasks precede their implementation tasks; `docs/design-source.md` has a content test written before the document. |
| **II. Automated Release Gate** | `verify` (CI job name unchanged) runs lint:secrets, lint, typecheck, unit+component tests, build, and all Playwright projects (e2e, a11y, budget, visual); `pnpm run verify` is the identical local mirror. Production deploys only from `main` via Workers Builds after strict required checks. Every branch gets a Workers Builds preview. Placeholder tests are replaced by stricter-or-equal successors, as a reviewed part of this change; nothing is skipped or disabled. |
| **III. Human Review for Major Changes** | **This slice is a major change** (see "Major-change verdict" below). The PR must carry the `major-change` label and Don's approval after viewing the preview. |
| **IV. First-Party Before Custom** | Each capability names its first-party option (table below). All Astro choices were verified through the Astro Docs MCP (`astro-docs`), which was available; the doc pages are cited in research.md. |
| **V. Static by Default** | `output` stays static; every page prerendered (`robots.txt` is a prerendered endpoint). Client JS limited to the inline theme-init script (~0.5 KB), the theme toggle and the menu (bundled, small). Content readable with JS off (E2E no-JS tests). |
| **VI. Content as Files** | No content collections are needed yet (placeholder home and 404 are Astro pages). Navigation and site defaults are typed TypeScript modules in the repo; invalid config fails `astro check`/unit tests. No CMS or database. |
| **VII. Private Data** | No personal data collected; theme choice stays in the visitor's browser; no cookies (tested). No new secrets anywhere; `workersSubdomain` is public. `.env*` untouched. |
| **VIII. Fly.io Best Practices** | Not applicable: no Fly.io service in this feature (contact API is a later feature). |
| **IX. Cost Ceiling** | New items (Tailwind packages, sitemap integration, `actions/upload-artifact`) are free; no new services. **Expected additional monthly cost: $0.** |
| **X. Accessible, Fast and Private** | WCAG 2.2 AA enforced by axe on every template in both themes plus keyboard/focus E2E; performance budget enforced in CI; only third-party script is Cloudflare Web Analytics (privacy-focused, injected at the edge, main build only). |
| **XI. Spec Kit Workflow** | Spec Kit branch/dir naming; one feature on this branch. Out-of-scope items stay in the spec's follow-up list. |
| **Technology constraints** | Astro current stable, TypeScript strict, Tailwind; Flux theme ported as the design baseline (accessibility-driven shade adjustments recorded in `docs/design-source.md` for review); Cloudflare hosting with per-branch preview; Cloudflare Web Analytics; GitHub Actions; pnpm with committed lockfile. |

### First-party option per capability (Principle IV)

| Capability | First-party option | Used? / why it falls short |
|---|---|---|
| Styling | Tailwind 4 via `@tailwindcss/vite` (`astro add tailwind`) | Used |
| Prose styling | `@tailwindcss/typography` (Astro recipe) | Used |
| Fonts | Astro fonts API | Not needed now (system stack, FR-003); used by the font follow-up |
| Icons | Astro SVG components | Used |
| Layout / components | Astro layouts and components | Used |
| Theme before paint | Astro `is:inline` script | Used (processed scripts are deferred and run after paint) |
| Theme switch / menu | Astro processed `<script>` | Used; native `<details>`/popover rejected because they collapse links without JS (R6) |
| 404 page | `src/pages/404.astro` + Workers `not_found_handling: "404-page"` | Used |
| Sitemap | `@astrojs/sitemap` | Used |
| robots.txt | Astro static endpoint (sitemap guide pattern) | Used |
| SEO metadata | No official Astro SEO integration | Small in-repo `Seo.astro`; a third-party package is not clearly better |
| Site address | Astro `site` config | Used; value computed from Workers Builds env (R2) |
| CSP | Astro `security.csp` | Used for script/style hashes and fetch directives |
| Other security headers | Cloudflare `_headers` | Used (meta CSP cannot carry `frame-ancestors`) |
| Hosting / deploy / previews | Workers static assets + Workers Builds + preview aliases | Used |
| Analytics | Cloudflare Web Analytics automatic setup | Used (no code) |
| Component tests | Astro Container API + Vitest | Used |
| E2E server | `wrangler dev` (Cloudflare local runtime) | Used instead of `astro preview`, which does not apply `_headers` or 404 handling |
| Performance budget | No Astro/Cloudflare pre-deploy option | Playwright + CDP (already installed); Lighthouse CI unnecessary |
| Screenshot baselines | Playwright `toHaveScreenshot` | Used (no new dependency) |

### Major-change verdict (Principle III)

**Major.** It (1) changes the design system, site-wide layout, navigation and visual identity
(Flux port, header/footer/nav/theme switch); (2) adds dependencies (`tailwindcss`,
`@tailwindcss/vite`, `@tailwindcss/typography`, `@astrojs/sitemap`) and a CI action
(`actions/upload-artifact`); (3) changes CI and deployment configuration (`ci.yml`, `verify`,
`playwright.config.ts`, `wrangler.jsonc` `not_found_handling`, a new non-production deploy
script and the matching Workers Builds dashboard setting, `public/_headers`). Running cost does
not increase. The PR needs the `major-change` label and Don's approval after he views the preview
and compares it to the Ghost reference screenshots.

## Design source document (first task) — required contents of `docs/design-source.md`

1. **How to get Flux**: run `gh repo clone drcdev/flux .reference/flux -- --depth 1` from the
   repository root. `.reference/` is gitignored. Treat it as read-only: read it, port by hand,
   never import from it, never copy the repo in.
2. **Mapping table** (Flux part → becomes → owner):

   | Flux part | Becomes | Owner |
   |---|---|---|
   | `@theme` palettes dusk, rust, sage, lavender, mist, sand, mauve (50–950) | Tailwind theme tokens in `src/styles/global.css`, ported as-is, keeping "change the BASE value to update the palette" | Foundation |
   | `accent-*` palette from Ghost's `--ghost-accent-color` | Fixed accent palette derived from rust `#d68844` | Foundation |
   | `--gh-font-body` / `--gh-font-heading` | System font stack now; follow-up for the real Ghost fonts, self-hosted later via Astro's built-in font support | Foundation (follow-up: fonts) |
   | `@custom-variant dark`, `.prose-accent`, heading colours (H1/H2 rust, H3 sage, H4 lavender), `.table-wrapper`, focus rings | Global styles, as-is | Foundation |
   | Prism token colours + `kg-code-card` | Shiki light/dark themes + code block component (note Astro CSP + Shiki inline styles, research R8) | Blog |
   | `kg-width-wide` / `kg-width-full` + `content-feature-image.hbs` | MDX image components | Pages |
   | `table-wrapper.js` | CSS or build-time Markdown plugin; no client script | Blog |
   | `theme-toggle.js` + `ui-theme-toggle.hbs` | Inline head script + toggle component | Foundation |
   | `navigation-toggle.js` | Native HTML if accessible, else tiny script; progressive enhancement per spec (tiny script chosen, research R6) | Foundation |
   | `default.hbs`, `layout-header.hbs`, `layout-footer.hbs`, `navigation.hbs` | Base layout, header, footer, navigation | Foundation |
   | `partials/Icons/*` | SVG components via Astro's built-in SVG imports; each feature ports what it uses | Each feature |
   | `layout-author-hero.hbs` | Home introduction card | Pages |
   | `page.hbs` + `content-section.hbs` | Page layout | Pages |
   | `ui-share.hbs` | Share component with Web Share API + plain links fallback | Blog |
   | `post.hbs`, `content-post-list.hbs` (timeline), `content-post-list-featured.hbs` (bento grid), `content-post-meta.hbs`, `ui-tag-pill.hbs` | Reference patterns only; blog and portfolio designed fresh | Blog / Portfolio |
   | `ui-contact-form.hbs`, `contact-form.js`, `supabase/functions/contact/index.ts`, `supabase/migrations/*contact*` | Contact form and API | Contact |
   | `error.hbs` | Not-found page | Foundation |
   | CSP meta tag in `default.hbs` | Cloudflare `_headers` security headers (plus Astro's CSP meta for hashes), tightened: remove Web3Forms, jsDelivr, Supabase; allow the Cloudflare Web Analytics beacon | Foundation |

3. **What doesn't carry over**: Ghost member sign-up/subscribe/account buttons and portal; Ghost
   search; comments (`ui-comment.hbs`); `content-cta.hbs`; the AI analysis feature
   (`ui-post-ai.hbs`, `post-ai.js`, the Supabase functions `analyze`, `auth-bridge`, `feedback`
   and their migrations); the Drift, Convergence and News categories (`drift.hbs`,
   `convergence.hbs`, `news.hbs`, `newsletter-*.hbs`, `newsletter-description.js`, their icons
   `Icons/types/*`, `routes.yaml` routing and `redirects.json`); the Ghost deploy workflow,
   gscan, `.scripts` content scripts; Prism, marked, dompurify, terser and the SRI hash script
   (`inject-hashes.js`).
4. **Current live URLs**: posts `/drift/{year}/{slug}/`, `/convergence/{year}/{slug}/`,
   `/news/{year}/{slug}/`; category pages `/drift/`, `/convergence/`, `/news/`; topics
   `/topic/{slug}/`; author `/author/{slug}/`; pages `/about/`, `/contact/`, `/privacy-policy/`,
   `/cookie-policy/`, `/terms-of-use/`, `/technology/`. Page URLs stay where the page still
   exists; blog URLs change; there are no redirects (Don updates external links himself).
5. **Accessibility adjustments**: any shade changed for WCAG AA contrast (research R3), with
   before/after and the pairing that failed. Empty if none.

## What this feature ports (and does not)

- **Ports**: `screen.css` palettes, dark variant, `.prose-accent` + heading colours, table
  styles, focus rings (not `kg-*`/Prism); `default.hbs` → base layout; header, footer and
  navigation without subscribe/account/search; footer links `/privacy-policy/`, `/terms-of-use/`,
  `/technology/`, `https://github.com/drcdev`, `https://www.linkedin.com/in/drcdev`; theme toggle
  with the same behaviour (dark default, dark → light → system, stored choice, no flash via
  inline head script); mobile menu; menu/theme/social icons; not-found page.

## Build order (for the tasks phase)

Tests come first inside every step.

1. **Design source**: content test → `docs/design-source.md`; `.gitignore`/no-import test.
2. **Ghost reference screenshots** (before any styling): capture spec + config → run once →
   commit `tests/reference/ghost/*.png` + README.
3. **Tooling**: add Tailwind (+ typography) and sitemap via `astro add`; switch Playwright to
   `wrangler dev`; add Playwright projects and `verify` scripts; `wrangler.jsonc`
   `not_found_handling`; CI artifact step.
4. **Site origin**: unit tests → `src/lib/site-origin.ts`, `previewAlias`, `astro.config.mjs`
   `site`, `scripts/deploy/preview.ts`, `deploy:preview` script, `workersSubdomain` in
   `setup/config.json`, `docs/setup.md` item 10 update.
5. **Design tokens and global styles**: unit test on tokens (every palette has BASE + 11 shades
   derived from BASE; accent BASE `#d68844`) → `src/styles/global.css`.
6. **Shell** (US1): component + E2E + a11y tests → BaseLayout, SkipLink, SiteHeader (menu),
   SiteFooter, icons, navigation config, placeholder home.
7. **Themes** (US2): unit + component + E2E first-paint tests → `theme-init.js`, `theme.ts`,
   ThemeToggle.
8. **Not-found** (US5): component + E2E tests → `404.astro`.
9. **SEO** (US4): unit + component + E2E tests → Seo, site defaults, sitemap, `robots.txt`,
   default OG image.
10. **Security + statistics** (FR-024–026): unit + E2E tests → `astro.config.mjs` CSP,
    `public/_headers`.
11. **Budget + visual** (FR-005a, FR-027): budget spec; visual spec → baselines (darwin locally,
    linux from CI artifact).
12. **Release pipeline check** (US3): quickstart walk-through on the PR preview; Don changes the
    non-production deploy command; confirm canonical = preview address.

## Project Structure

### Documentation (this feature)

```text
specs/002-site-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── shell-dom.md
│   ├── theme.md
│   ├── head-metadata.md
│   ├── site-origin.md
│   ├── http-responses.md
│   ├── verify-gate.md
│   └── design-source-doc.md
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
astro.config.mjs                 # site (resolveSiteOrigin), tailwind vite plugin, sitemap, security.csp, trailingSlash
wrangler.jsonc                   # + assets.not_found_handling: "404-page"
package.json                     # new deps; scripts: verify (extended), test:a11y|budget|visual(+:update), reference:capture, deploy:preview
playwright.config.ts             # webServer → wrangler dev; projects e2e|a11y|budget|visual
vitest.config.ts                 # include tests/unit/** and tests/component/**
.gitignore                       # + .reference/ (done during planning)
.github/workflows/ci.yml         # + upload Playwright artifacts on failure
setup/config.json                # + workersSubdomain
docs/
├── design-source.md             # NEW — first task
└── setup.md                     # item 10: non-production deploy command → pnpm run deploy:preview
public/
├── _headers                     # extended security headers (noindex kept)
└── og-default.png               # default sharing image (1200×630)
scripts/
├── deploy/preview.ts            # wrangler versions upload --preview-alias <alias>
└── og-image/render.ts           # one-off render of og-default.png
src/
├── config/
│   ├── navigation.ts            # primary, footer, social links; futureDestinations
│   └── site.ts                  # site name, default description/image/alt, locale, indexable=false
├── lib/
│   ├── site-origin.ts           # resolveSiteOrigin, previewAlias (pure)
│   ├── theme.ts                 # parseTheme, nextTheme, isDark (pure)
│   └── nav.ts                   # isCurrent(pathname, href)
├── scripts/
│   └── theme-init.js            # inline pre-paint script (hashed into CSP)
├── icons/                       # menu, sun, moon, github, linkedin (.svg)
├── styles/global.css            # Tailwind import, typography plugin, @theme palettes, variants, ported rules
├── components/
│   ├── Seo.astro
│   ├── SkipLink.astro
│   ├── SiteHeader.astro         # + menu script
│   ├── SiteFooter.astro
│   └── ThemeToggle.astro        # + toggle script
├── layouts/BaseLayout.astro
└── pages/
    ├── index.astro              # placeholder home inside the shell
    ├── 404.astro
    └── robots.txt.ts
tests/
├── unit/site/                   # origin, alias, theme, nav, headers, csp, sitemap, tokens, design-source, theme-init
├── component/                   # Container API tests per component/layout/page
├── e2e/
│   ├── shell.spec.ts  menu.spec.ts  theme.spec.ts  not-found.spec.ts
│   ├── seo.spec.ts  headers.spec.ts  analytics.spec.ts  no-js.spec.ts
│   ├── a11y.spec.ts  budget.spec.ts  visual.spec.ts (+ *-snapshots/ per platform)
│   └── (placeholder.a11y.spec.ts, placeholder.budget.spec.ts removed — superseded)
└── reference/
    ├── playwright.config.ts     # not part of verify
    ├── capture-ghost.spec.ts
    └── ghost/                   # 12 PNGs + README.md
```

**Structure Decision**: Single Astro project at the repository root, extending the layout 001
created (`src/`, `public/`, `tests/unit`, `tests/e2e`, `scripts/`). New top-level test folders
`tests/component/` (Container API) and `tests/reference/` (live-site capture, excluded from
`verify`). The existing `scripts/setup-check/` and its tests are untouched except that
`setup/config.json` gains one field (the setup check's `SetupConfig` type gets the optional
field so `astro check` passes).

## Risks and open questions

- **Preview address depends on a dashboard change** (R2): until Don sets the non-production
  deploy command to `pnpm run deploy:preview`, previews are uploaded without the alias their
  metadata points to. Mitigation: quickstart step checks canonical = served address on the first
  preview; site is `noindex` so no search impact.
- **Branch → alias naming is ours, not Cloudflare's**; if Cloudflare later auto-aliases branches
  differently, both URLs still work and ours stays the canonical one.
- **Production host is a committed value** (`reviewHost`); the domain switch must update it with
  the noindex removal (added to the existing domain-switch follow-up).
- **Visual baselines are per-OS**; the first CI run on this branch will fail until the Linux
  baselines from its artifact are reviewed and committed (by design — no vacuous pass).
- **Contrast of ported Flux pairings** may need shade adjustments; each one is recorded in
  `docs/design-source.md` for Don's review (design deviation within this major change).
- **Container API is experimental** in Astro; tests use the stable-in-practice `renderToString`.
- **Live Ghost site availability** for reference capture (spec assumption); if unreachable, the
  task stops and reports rather than guessing.
- **Shiki vs Astro CSP** is a Blog-feature concern, recorded now in `docs/design-source.md`.

## Complexity Tracking

No constitution violations to justify.
