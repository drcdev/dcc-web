# Quickstart: validating standalone pages

How to prove the feature works, locally and on the preview deployment. Formats and rules are in
[contracts/](./contracts/) and [data-model.md](./data-model.md); this guide only lists what to
run and what to expect.

## Prerequisites

- Node from nvm: `node -v` must match `.nvmrc` (24); otherwise run
  `source ~/.nvm/nvm.sh && nvm use` in the same command as each toolchain call (CLAUDE.md).
- `pnpm install --frozen-lockfile`, and `pnpm exec playwright install chromium` once.
- Docker Desktop only for refreshing Linux visual baselines (`pnpm run test:visual:update:linux`).

## 1. Full local gate

```sh
pnpm run verify
```

Expected: passes. It now includes the page schema/body/address/navigation unit tests, section
and layout component tests, the build-failure tests (`tests/build/`), the fixture site build
(`build:fixtures`), and the Playwright projects `e2e`, `a11y`, `budget`, `visual` and the new
`sections` project.

## 2. Launch pages exist (US1, SC-001)

```sh
pnpm run build
ls dist/index.html dist/{services,speaking,about,privacy-policy,terms-of-use,technology}/index.html
grep -c "<loc>" dist/sitemap-0.xml       # 7 pages
test ! -e dist/cookie-policy/index.html  # no cookie policy page (FR-022)
pnpm exec playwright test --project=e2e tests/e2e/pages.spec.ts
```

Expected: all seven files exist; E2E confirms status 200, one `<h1>` with the page title, the draft
notice, the current-page marker on Services/Speaking/About, and 404 for `/cookie-policy/`,
`/writing/`, `/projects/`, `/contact/`.

## 3. One file publishes a page (US3, SC-002)

```sh
pnpm exec vitest run tests/build/one-file-page.test.ts
```

Expected: the fixture site with only `workshops.mdx` added builds; `/workshops/` has its title,
description, canonical link and sitemap entry; the header navigation is unchanged.

By hand (optional): add `src/content/pages/workshops.mdx` with the minimal example from
[contracts/page-file.md](./contracts/page-file.md), run `pnpm run build`, open
`dist/workshops/index.html`, then delete the file.

## 4. Broken files fail clearly (US5, SC-003)

```sh
pnpm exec vitest run tests/build/page-validation.test.ts
```

Expected: one passing test per row of [contracts/build-errors.md](./contracts/build-errors.md);
each asserts the build rejected and the message names the file and problem.

By hand (optional): remove `description` from `src/content/pages/about.mdx`, run
`pnpm run build`; it stops with an error naming `about.mdx` and `description`. Restore the file.

## 5. Sections (US4, SC-004, SC-005)

```sh
pnpm run build:fixtures
pnpm exec playwright test --project=sections
```

Expected: the fixture page using every section passes axe in both themes at phone and desktop
widths, has no horizontal scroll at 320, 390, 1100 and 1280 px, reads fully with JavaScript off,
and matches its visual baselines; the wide image is wider than the text column at 1280 px and the
full-width image equals the viewport's content width.

## 6. Accessibility, budget and visuals (FR-028–FR-030, SC-004, SC-007)

```sh
pnpm run test:a11y      # every launch page × both themes × phone/desktop, JS on and off
pnpm run test:budget    # every launch page within the foundation budget
pnpm run test:visual    # home + about at 390/1280 × dark/light, plus unchanged shell baselines
```

New baselines are generated with `pnpm run test:visual:update` (macOS) and
`pnpm run test:visual:update:linux` (Linux, Docker). Any change to the existing header, footer,
menu or not-found baselines must be explained in the PR; none is expected.

## 7. Preview deployment checks for Don (SC-006, major change)

On the branch's Workers Builds preview URL:

1. Follow every header and footer link except Writing, Projects and Contact; each shows a real
   page with the draft notice.
2. Open `/`, `/about/`, `/privacy-policy/`, `/terms-of-use/`, `/technology/` (old addresses).
3. Compare the home page with https://www.doncoleman.ca/ (and
   `tests/reference/ghost/home-*.png`) in both themes at phone and desktop widths: same card,
   gradient border, photo, name, tagline, bio and social links; the Subscribe button replaced by
   the call to action to `/services/`.
4. Read the privacy policy, terms of use and technology pages for accuracy against the new site.
