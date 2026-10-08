# Quickstart: validating page visibility and file-driven menus (029)

Settings and outcomes are defined in [contracts/page-settings.md](./contracts/page-settings.md)
and [data-model.md](./data-model.md); this guide only says how to see them.

## Prerequisites

- Node from `.nvmrc` (see CLAUDE.md "Local toolchain"); in an agent worktree use the job's
  `run.sh` wrapper for every `pnpm` call.
- Dependencies installed (`pnpm install --frozen-lockfile`).

## 1. Fast checks (unit, component)

```sh
pnpm exec vitest run tests/unit/content/page-schema.test.ts tests/unit/content/navigation.test.ts \
  tests/unit/content/launch-content.test.ts tests/unit/content/content-helper.test.ts \
  tests/unit/site/navigation.test.ts tests/component/SiteFooter.test.ts
```

Expected: the schema accepts `visible`/`draft`/`nav.location`, rejects V1 to V4; `buildMenus()`
splits header and footer, orders by position, and throws V6 naming both files; the footer
renders from its prop.

## 2. Build checks (real `astro build` on fixture sites)

```sh
pnpm exec vitest run tests/build/drafts.test.ts tests/build/page-validation.test.ts
```

Expected:

- Production fixture build (`WORKERS_CI=1`, `WORKERS_CI_BRANCH=main`) with a not-visible fixture
  page that has a footer location and its own image: no `<page>/index.html`, no footer link, no
  sitemap entry, and the image absent from `dist/_astro/`.
- Preview fixture build (`WORKERS_CI_BRANCH=some-branch`): the same page built with
  `data-draft-notice` and a noindex robots tag, linked from the footer, absent from the sitemap.
- Sync runs fail with rows V5, V7, V8, V9 of the contract, each naming the file.

## 3. Today's content is unchanged (SC-005)

```sh
pnpm exec astro build
```

Then compare with `main`:

- `dist/index.html` header links: Home, Work with me, Writing, Projects, About, Contact.
- Footer links: Privacy policy, Terms of use, Technology, then GitHub and LinkedIn.
- `dist/sitemap-0.xml` lists the same addresses as a `main` build of the same commit's content.

The e2e shell spec (`tests/e2e/shell.spec.ts`) asserts the header and footer on every template
and must pass unchanged; the visual baselines must not change.

## 4. By hand on a preview (optional, Don)

1. On a throwaway branch, set `visible: false` on `technology.mdx` and push.
2. On that branch's preview, `/technology/` shows the draft notice, carries noindex, is still in
   the footer and is absent from `/sitemap-0.xml`.
3. The production behaviour (page absent) is proven by the build test in step 2, not by
   merging a hidden page. Delete the throwaway branch.

## 5. Full gate

`pnpm run verify` (ask Don first; see memory "Check in before full verify gate").
