# Quickstart: validating the retired status

Run everything from the repository (or worktree) root. Node comes from nvm: check `node -v`
against `.nvmrc` and run `source ~/.nvm/nvm.sh && nvm use` in the same command as any `pnpm`
call. macOS has no `timeout`; bound long runs with `perl -e 'alarm N; exec @ARGV' …`.

## 1. Inner loop

```sh
pnpm run test:unit          # schema (RP01-RP03, S02), replacement check and resolver (RP04, RP05), status map, components
pnpm run verify:quick       # lint, typecheck, unit + worker tests, build
```

Expected: all green. The component tests show the Retired pill (`data-tone="mauve"`, text
"Retired") and every form of the note (contracts/pages-dom.md).

## 2. Build tests

```sh
pnpm exec vitest run --project build tests/build/project-validation.test.ts tests/build/drafts.test.ts
```

Expected:

- `project-validation`: the RP04 run fails a production build of a retired draft that names a
  missing project, and the message names the file and the missing id.
- `drafts`: in the production build `/projects/retired/` exists, its note names "Draft
  project" with no link, and the index lists the retired row with the Retired pill; in the
  preview build the note links to `/projects/draft/`.

## 3. See it

```sh
pnpm run build && pnpm exec astro preview
```

- `/projects/`: Tempo's row shows a filled mauve "Retired" pill in its usual place (by date).
- `/projects/tempo/`: the pill, then "**Retired.** I no longer use or maintain this project.
  It was replaced by Cadence." with no link; all four parts still there.
- Turn JavaScript off and reload: the pill and the note are unchanged.
- Toggle dark mode: the pill becomes a mauve-800 fill with light text.

Fixture site (what the browser tests use): `pnpm run build:fixtures && pnpm exec astro preview
--root .cache/fixture-site --port 4322`, then open `/projects/retired/` and follow the
"Minimal project" link in the note to `/projects/minimal/`.

## 4. Browser tests

```sh
pnpm exec playwright test tests/e2e/projects-fixtures.spec.ts tests/e2e/theme-tokens.spec.ts
pnpm run test:a11y
pnpm run test:visual
```

Expected: the link journey passes, the retired pill's computed colours match the mauve tokens
in both themes, axe finds nothing on the retired fixture story, and the visual project fails
only on the 8 missing images per platform listed in plan.md "Visual baselines" until they are
generated:

```sh
pnpm run test:visual:update          # macOS images
pnpm run test:visual:update:linux    # Linux images (Docker Desktop)
git status tests/e2e/visual.spec.ts-snapshots   # only the 16 new files, nothing modified
```

## 5. Full gate

Ask Don before running `pnpm run verify` (parallel gates overload his machine); run it in the
background under `perl alarm` and read the `VERIFY_EXIT=` line.

## 6. Preview check (major change)

On the branch preview deployment Don checks `/projects/` and `/projects/tempo/` in both themes
before approving the PR; auto-merge stays off.
