# Quickstart: validating the Work with me merge

**Feature**: `026-services-speaking-merge` | **Plan**: [plan.md](./plan.md) |
**Contract**: [contracts/work-with-me-page.md](./contracts/work-with-me-page.md)

Run every command with node from `.nvmrc` (see `CLAUDE.md`, Local toolchain). Ask Don before the
full `pnpm run verify` gate.

## 1. Fast checks (unit, component)

```sh
pnpm run test:unit    # unit project: tests/unit and tests/component
```

Expect: the launch page list names `work-with-me.mdx` at position 2 and no Services or Speaking
file; the navigation tests return six items in the contract's order; the header component marks
only Work with me current on `/work-with-me/`; the launch-content check reports the page as a
draft and nothing missing.

## 2. Build checks

```sh
pnpm run build
ls dist/work-with-me/index.html      # exists
ls dist/services dist/speaking       # both: No such file or directory
grep -c '/work-with-me/' dist/sitemap-0.xml            # 1
grep -rlE 'href="/(services|speaking)/' dist --include=*.html   # no output
grep -nE '/(services|speaking)' public/_redirects      # no output
```

Then the build tests (`pnpm run test:build` or the content subset) pass, including the
`launch.expectedPages` file check in `tests/build/indexing.test.ts`.

## 3. Browser checks

```sh
pnpm exec playwright test tests/e2e/pages.spec.ts tests/e2e/shell.spec.ts tests/e2e/menu.spec.ts \
  tests/e2e/no-js.spec.ts tests/e2e/not-found.spec.ts tests/e2e/site-links.spec.ts
```

Expect: `/work-with-me/` shows every section in order with one call to action; the menu has six
links on every template; `/services/` and `/speaking/` return 404; the crawl finds no broken
internal link.

## 4. Visual baselines

```sh
pnpm run test:visual:update          # macOS
pnpm run test:visual:update:linux    # Linux, needs Docker Desktop
git status tests/e2e/visual.spec.ts-snapshots/
```

Expect changes only in `header-desktop-*`, `menu-open-phone-*`, `not-found-*` and `sections-*`
(research R7). Anything else is a regression.

## 5. Preview (Don, before approving)

Open the branch preview at `/work-with-me/` in light and dark, desktop and phone; check the section order
(lead, Speaking topics, Past talks, Consulting, Kinds of work, How I work, What I don't do), the lead,
meta description and call to action wording; check `/services/` and `/speaking/` show
the not-found page and the header reads Home, Work with me, Writing, Projects, About, Contact.
