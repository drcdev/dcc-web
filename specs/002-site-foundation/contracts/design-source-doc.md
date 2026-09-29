# Contract: `docs/design-source.md`

Test: `tests/unit/site/design-source.test.ts` (written before the document) asserts presence of
each item below.

## Required sections (headings)

1. `How to get Flux` — contains `gh repo clone drcdev/flux .reference/flux -- --depth 1`, states
   read-only, gitignored, never imported.
2. `Mapping` — a table with columns `Flux part | Becomes | Owner`; one row per entry in the plan's
   "Design source document" table (18 rows). Each owner is one of Foundation, Pages, Blog,
   Portfolio, Contact, Each feature. Each Flux name in the plan table appears verbatim
   (e.g. `theme-toggle.js`, `ui-theme-toggle.hbs`, `layout-author-hero.hbs`, `ui-share.hbs`,
   `error.hbs`, `table-wrapper.js`, `kg-width-wide`, `content-feature-image.hbs`,
   `ui-contact-form.hbs`, `contact-form.js`, `supabase/functions/contact/index.ts`,
   `default.hbs`, `layout-header.hbs`, `layout-footer.hbs`, `navigation.hbs`,
   `navigation-toggle.js`, `partials/Icons`, `page.hbs`, `content-section.hbs`, `post.hbs`,
   `content-post-list.hbs`, `content-post-list-featured.hbs`, `content-post-meta.hbs`,
   `ui-tag-pill.hbs`, `kg-code-card`, `#d68844`, `dusk`, `rust`, `sage`, `lavender`, `mist`,
   `sand`, `mauve`).
3. `What doesn't carry over` — mentions member sign-up/subscribe/account and portal, Ghost
   search, comments, `content-cta.hbs`, `ui-post-ai.hbs`, `post-ai.js`, Supabase functions,
   `drift.hbs`, `convergence.hbs`, `news.hbs`, `newsletter-`, `routes.yaml`, Ghost deploy
   workflow, gscan, `.scripts`, Prism, marked, dompurify, terser, SRI hash script.
4. `Current live URLs` — contains `/drift/{year}/{slug}/`, `/convergence/{year}/{slug}/`,
   `/news/{year}/{slug}/`, `/drift/`, `/convergence/`, `/news/`, `/topic/{slug}/`,
   `/author/{slug}/`, `/about/`, `/contact/`, `/privacy-policy/`, `/cookie-policy/`,
   `/terms-of-use/`, `/technology/`, and the words "no redirects".
5. `Accessibility adjustments` — present (may say "None").
