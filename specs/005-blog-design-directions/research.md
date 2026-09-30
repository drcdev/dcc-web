# Research: Design directions for the blog

**Feature**: 005-blog-design-directions | **Date**: 2026-09-29 | **Plan**: [plan.md](./plan.md)

Every Astro choice below cites the Astro documentation page found through the Astro Docs MCP
server (`astro-docs`), as the constitution's Development Workflow requires. The MCP was
available while this plan was written.

## R1. Where the prototypes live and how they are built

- **Decision**: Static Astro page routes under `src/pages/design/blog/`: an `index.astro`
  directions index and one folder per direction (`a/`, `b/`, `c/`). Code used only by the
  prototypes (sample data, the sample post body, components, images) lives in
  underscore-prefixed folders inside `src/pages/design/blog/` (`_data/`, `_components/`,
  `_images/`), which the router ignores. Every page renders inside the existing `BaseLayout`
  (header, footer, theme toggle, skip link), with `getNavigation()` for the header, so the
  site's shell, tokens and both themes apply unchanged.
- **Rationale**: File-based static routes are Astro's first-party way to add pages, and they
  are prerendered (Principle V). With everything, components included, in one folder, the
  pre-merge removal is a single `git rm -r src/pages/design/blog` that leaves nothing behind in
  `src/components/`. Astro docs, "Excluding pages"
  (docs.astro.build/en/guides/routing/#excluding-pages): files and folders in `src/pages/`
  whose names start with `_` are not routed and not emitted.
- **Alternatives considered**: Components under `src/components/design/blog/` (rejected: a
  second folder to remove, and a likely conflict zone with the parallel portfolio feature); a
  content collection for the sample posts (rejected: the brief says no content schemas yet, and
  the real schema belongs to the later blog feature); a standalone HTML mock-up outside Astro
  (rejected: it would not use the site's layout, tokens and themes, so it would not show what
  the blog will look like).

## R2. Pagination, topic pages and post pages inside the prototypes

- **Decision**: Listing pages use `getStaticPaths()` with Astro's built-in `paginate()` over
  the hard-coded sample posts (page size 5; 13 posts give 3 pages, so a first, a middle and a
  last page exist). Topic pages use `getStaticPaths()` over the four sample topics. Post pages
  use `getStaticPaths()` over the sample posts. Two posts get full bodies (one with a feature
  image, one without); every other post page shows its real header, summary and related posts
  above a short body that ends by linking to the full sample post, so no link is dead.
- **Rationale**: `paginate()` produces the first/previous/next/last addresses the real blog
  would use, so the pagination controls are working links (spec assumption: "working links
  within the prototype where practical"). Astro docs: "Pagination"
  (docs.astro.build/en/guides/routing/#pagination), "`paginate()`"
  (docs.astro.build/en/reference/routing-reference/#paginate), "Dynamic routes"
  (docs.astro.build/en/guides/routing/#dynamic-routes).
- **Alternatives considered**: Hand-written static pages per listing page (rejected: more
  files, and they would not show the addresses `paginate()` actually generates); a full body
  for every sample post (rejected: 13 bodies add nothing a reviewer can judge; two bodies cover
  the with-image and without-image cases).

## R3. Keeping the prototypes out of the sitemap, search engines and navigation (FR-017)

- **Decision**:
  1. **Sitemap**: extend the existing `@astrojs/sitemap` `filter` in `astro.config.mjs` to drop
     every page whose path starts with `/design/` (not only `/design/blog/`). It is written as
     one condition so the parallel portfolio feature, which also plans prototypes under
     `/design/`, needs the identical line, and a rebase conflict resolves by keeping one copy.
  2. **Indexing**: every prototype page passes `noindex` to `Seo.astro` explicitly (the site is
     already noindex through `site.indexable: false` and `X-Robots-Tag: noindex` in
     `public/_headers`, but the prototypes must stay noindex even if those change) and
     `canonical={false}`, so no prototype claims a canonical address.
  3. **Navigation**: nothing is added to `src/config/navigation.ts` or to any page's `nav`. The
     header keeps "Writing" pointing at `/writing/`, which stays a reserved not-found address.
  4. **Not mistaken for the real blog**: every prototype page opens with a visible notice
     ("Design prototype for review. This is not the published blog.") and its document title
     starts with "Prototype".
- **Rationale**: The sitemap integration's `filter()` option is the first-party way to leave
  pages out. Astro docs, "@astrojs/sitemap, Configuration, filter()"
  (docs.astro.build/en/guides/integrations-guide/sitemap/#configuration). `robots.txt` keeps
  `Allow: /`, because a `Disallow` would hide the noindex signal (existing comment in
  `src/pages/robots.txt.ts`). The existing e2e tests that assert the exact sitemap contents
  (`tests/e2e/seo.spec.ts`, `tests/e2e/pages.spec.ts`) keep passing unchanged, which is itself
  the regression check.
- **Alternatives considered**: `serialize()` returning `undefined` (works, but `filter()` is
  already in use and is the simpler documented option); `Disallow: /design/` in robots.txt
  (rejected for the reason above); building the prototypes only on preview deployments through
  an environment flag (rejected: build configuration for a throwaway page set, and the
  prototypes are removed before merge, so production never builds them anyway).

## R4. Code samples under the site's Content Security Policy

- **Decision**: The sample post's code block is a plain `<pre><code>` styled by the existing
  `prose` and `.prose-accent` rules (`--tw-prose-pre-bg`, `--tw-prose-pre-code`), with no syntax
  highlighting in the prototypes. The block is a keyboard-focusable scroll region
  (`tabindex="0"`, `role="region"`, `aria-label`), so a long line scrolls inside the block, not
  the page. The decision document says syntax highlighting is chosen by the later blog feature.
- **Rationale**: The site's CSP (`security.csp` in `astro.config.mjs`) allows only `'self'` and
  generated hashes for styles. Astro docs, "Configuration Reference, security.csp"
  (docs.astro.build/en/reference/configuration-reference/#securitycsp): "Shiki isn't currently
  supported. By design, Shiki functions use inline styles that cannot work with Astro CSP
  implementation. Consider using `<Prism />`". `<Prism />` needs the `@astrojs/prism` package,
  a new dependency and therefore a major-change trigger that a throwaway prototype does not
  justify. `docs/design-source.md` already gives code highlighting to the Blog feature.
- **Alternatives considered**: Astro's `<Code />` (Shiki) component (rejected: its inline style
  attributes are blocked by the CSP); allowing `'unsafe-inline'` on `style-src-attr` (rejected:
  weakens the security policy); `@astrojs/prism` (deferred to the blog feature).

## R5. Topic colour-coding without inline styles

- **Decision**: Where a direction colour-codes topics (Flux's accent-variable pattern), each
  topic maps to a fixed set of Tailwind utility classes from an existing palette (rust, sage,
  lavender, mist), looked up from the sample data module. No `style="--accent: …"` attributes
  and no `define:vars`.
- **Rationale**: Inline style attributes and `define:vars` output are blocked by the site's CSP
  for the same reason as R4 (Astro docs, "security.csp.styleDirective.resources"
  (docs.astro.build/en/reference/configuration-reference/#securitycspstyledirectiveresources):
  inline `style` attributes need `'unsafe-inline'` on `style-src-attr`). Utility classes compile
  into the site stylesheet, which the CSP already allows. Every pairing is checked by axe in both
  themes (R7); a failing shade is swapped for the nearest passing shade of the same palette,
  following "Accessibility adjustments" in `docs/design-source.md`. No new colour is needed.
- **Alternatives considered**: One CSS custom property per topic in `global.css` (rejected:
  edits a shared global file for throwaway pages); Flux's inline accent variable (rejected:
  CSP).

## R6. Sample images

- **Decision**: Five hand-drawn SVG illustrations (abstract diagrams: a data pipeline with
  audit checkpoints, a team topology, an agent loop around a legacy system, a clinical
  integration map, a network of systems) committed under `src/pages/design/blog/_images/` and
  rendered with `astro:assets` `<Image />`. Each has alt text that describes it and, in the
  post body, a caption. They use only palette colours and sit on a panel that reads in both
  themes.
- **Rationale**: `<Image />` is the first-party image component `FeatureImage.astro` already
  uses. Hand-made SVGs avoid any licensing question about stock photos, stay small for the
  performance budget, and are removed with the prototypes. Astro docs, "Images, Astro components
  for images" (docs.astro.build/en/guides/images/#astro-components-for-images).
- **Alternatives considered**: Stock photography (rejected: licensing and page weight);
  reusing `src/content/pages/images/don-coleman.jpg` (rejected: a portrait does not show how
  article feature images will look); remote images (rejected: the CSP allows only
  `img-src 'self' data:`).

## R7. Test coverage for the prototypes

- **Decision**: One new, self-contained Playwright spec, `tests/e2e/design-blog.a11y.spec.ts`.
  Its name matches the existing `a11y` project (`testMatch: /a11y\.spec\.ts$/`), which the `e2e`
  project ignores, so it runs inside `pnpm run verify` with no change to `playwright.config.ts`.
  It lists every prototype address (see [contracts/prototype-routes.md](./contracts/prototype-routes.md))
  and checks, for each page:
  - zero axe violations (WCAG 2.0, 2.1 and 2.2 A and AA tags) at phone (390 px) and desktop
    (1280 px) widths in the dark and light themes, and with JavaScript disabled (the same
    script-stripping technique as `a11y.spec.ts`);
  - exactly one `main`, exactly one `h1`, no skipped heading levels;
  - no horizontal page scroll at 320 px, including the wide table and the long code line;
  - readable with JavaScript disabled;
  - no CSP violations (reusing `tests/e2e/csp-violations.ts`);
  - `<meta name="robots" content="noindex">`, no canonical link, and the prototype notice;
  - every internal link on the page returns 200 (the screens link to each other, FR-005).
  It also checks once that the sitemap lists no `/design/` address and that the header
  navigation has no `/design/` link.
  The sample data's invariants (every starting topic covered, at least one featured post, a
  post without an image, a long title, a post with many topics, a topic with a single post,
  13 posts so pagination has three pages, no topic in any proposed post address, dates unique
  and sortable newest first) are a Vitest unit test, `tests/unit/design/blog-samples.test.ts`,
  which the existing `unit` project already includes (`tests/unit/**/*.test.ts`).
  The prototypes are **not** added to the committed visual baselines
  (`tests/e2e/visual.spec.ts-snapshots/`), to `TEMPLATES` in `tests/e2e/templates.ts`, to the
  budget gate or to `a11y.spec.ts`: they are removed before merge, the visual baselines cover
  only shipped templates, and editing those shared files would collide with the parallel
  portfolio feature.
- **Rationale**: Meets SC-003, FR-014 and FR-015 with the site's existing tools
  (`@axe-core/playwright`, Playwright, Vitest), with no new dependency, and removal is a file
  deletion. Test-first (Principle I): both test files are written first and seen to fail (404s,
  missing module) before any prototype page exists.
- **Alternatives considered**: Adding the prototype paths to `TEMPLATES` (rejected: every shell
  spec, the budget gate and the header and menu tests would then run over them, and the removal
  would edit shared files the portfolio feature also touches); component tests for each
  prototype component (rejected: the components are deleted before merge, and the e2e and axe
  checks exercise their rendered output directly, which is what Don reviews).

## R8. Screenshots for the decision document

- **Decision**: A standalone Playwright config, `tests/design/playwright.config.ts`, and spec,
  `tests/design/capture-blog.spec.ts`, modelled on the existing on-demand capture in
  `tests/reference/` (not part of `verify`, not a visual baseline). It runs against the
  production build served by `wrangler dev` (the same `webServer` command as the main config;
  `corepack pnpm run build` first) and writes one image per direction × screen (landing,
  listing, post) × width (phone 390, desktop 1280) × theme (dark, light) to
  `docs/design/blog/{direction}-{screen}-{width}-{theme}.jpg`: 36 images. JPEG at quality 80,
  full page but clipped to at most 3 200 CSS px tall, keeps the set small (target under 6 MB in
  total). It is run with
  `corepack pnpm exec playwright test --config tests/design/playwright.config.ts`, so no
  `package.json` script is added (`package.json` is shared with the parallel features).
- **Rationale**: Reuses the capture pattern Don already has; the images come from the same
  build the preview deploys, so they match the preview; they survive the removal of the
  prototypes (FR-021, SC-006).
- **Alternatives considered**: Screenshots by hand (rejected: not repeatable after a tweak);
  PNG (rejected: several times larger for full-page captures); keeping the capture spec on main
  (rejected: FR-018, and it targets addresses that no longer exist after removal).

## R9. Proposed addresses per direction

- **Decision**: Every direction keeps the blog under `/writing/` (reserved by features 002 and
  003) and gives each post an address with no topic in it (FR-012). Directions A and B propose
  `/writing/{slug}/`. Direction C proposes `/writing/{year}/{slug}/`, so its topic hubs can take
  the short `/writing/{topic}/` form without any chance of colliding with a post slug. All
  directions use `/writing/` for the landing page and `/writing/all/`, `/writing/all/2/`, … for
  the full listing (`paginate()` with a `[...page]` route). Topic pages are
  `/writing/topics/{topic}/` in A and B. Inside the prototypes the same shapes appear under
  `/design/blog/{a|b|c}/`, so the preview shows them working. Details in
  [contracts/prototype-routes.md](./contracts/prototype-routes.md).
- **Rationale**: A slug-only address is the most stable: it survives topic renames, merges and
  splits and a corrected date. The year form trades a little stability (changing a post's
  publish year would change its address) for a clean topic namespace. Both meet FR-012, and the
  decision document spells out the trade-off.
- **Alternatives considered**: Category-prefixed addresses like the current site's
  `/drift/{year}/{slug}/` (rejected: FR-012, and categories are retired); numeric IDs or
  date-only addresses (rejected: unreadable).

## R10. Pre-merge removal and preview timing

- **Decision**: The prototypes stay on the branch when the pull request is opened, so the
  preview deployment shows them for Don's review (FR-016). After Don has reviewed, and has
  chosen or asked for changes, a follow-up commit on the same branch:
  1. deletes `src/pages/design/blog/`, `tests/e2e/design-blog.a11y.spec.ts`,
     `tests/unit/design/` and `tests/design/`;
  2. restores `astro.config.mjs` to `origin/main`'s version
     (`git checkout origin/main -- astro.config.mjs`), which keeps any `/design/` filter the
     portfolio feature has already merged and otherwise drops this feature's;
  3. turns the decision document's preview links into plain text marked "removed after
     review; see the pictures";
  4. re-runs the full `verify` gate.
  The pull request is marked as a major change, auto-merge stays off, and the removal is a
  `[PREVIEW-CHECK]` task that waits on Don.
- **Rationale**: FR-016 and FR-018 pull in opposite directions in time; this order satisfies
  both, and the screenshots (R8) carry the directions after removal (FR-021).
- **Alternatives considered**: Deploying the prototypes from a separate branch that never
  merges (rejected: two pull requests for one decision, and the preview would not live on this
  feature's pull request); keeping the prototypes on main behind noindex (rejected: FR-018).

## R11. Cloudflare first-party options

- **Decision**: Nothing new on Cloudflare. The branch preview deployment that already exists
  (Workers static assets, preview per branch) serves the prototypes; `public/_headers` already
  sends `X-Robots-Tag: noindex` on every path.
- **Rationale**: Principles IV and VIII: there is nothing to add.
- **Alternatives considered**: Cloudflare Access in front of `/design/` on previews (rejected:
  the preview address is already unlisted and noindex, and Access would need dashboard
  configuration outside CI, which Principle VIII forbids).
