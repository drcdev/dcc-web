# Quickstart: validating the architecture diagram

**Feature**: `036-technology-architecture-diagram` | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Node from nvm: run `node -v`; if it is not the `.nvmrc` major (24), prefix each command below
  with `source ~/.nvm/nvm.sh && nvm use &&` in the same shell call (CLAUDE.md, Local toolchain).
- In a worktree, use the pnpm shim / wrapper described in the agent memory notes; bound long runs
  with `perl -e 'alarm N; exec @ARGV' …` (macOS has no `timeout`).
- Check port 4321 is free (`lsof -i :4321`) before any Playwright run; sibling worktrees share it.

## 1. Fast checks (unit, component, schema)

```sh
pnpm run test:unit          # layout L01–L09, source rules P03–P07, P08–P10, schema P01–P02,
                            # and the component test tests/component/sections/ArchitectureDiagram.test.ts
```

Expected: all pass. Deliberately break one thing to see a failure, then revert:

- Set a part file's `source` to `worker/src/nope.ts` → `pnpm run build` stops with
  `Architecture part file …: source "worker/src/nope.ts" does not exist in the repository.` (P04).
- Rename a part file → the build stops naming the missing and extra ids (P08).

## 2. Build checks

```sh
pnpm run build
pnpm run test:build:content   # local-site.test.ts: fragments resolve (M03/M06), unique ids (M10), no style attributes (M09)
pnpm exec vitest run --project build tests/build/architecture-validation.test.ts   # generateId wiring for P04
```

## 3. Browser checks

```sh
pnpm exec playwright test tests/e2e/architecture.spec.ts   # J01–J07, N01–N02, R01–R03, selected-state axe scan
pnpm exec playwright test --project=a11y                   # technology template, both themes and widths
pnpm exec playwright test tests/e2e/geometry.spec.ts tests/e2e/no-js.spec.ts
pnpm run test:budget                                       # technology page inside the budget (SC-005)
```

Before a full `pnpm run verify`, ask Don (agent memory: check in before the full gate); the local
gate is the `changed-paths.ts --base origin/main` tier.

## 4. Manual look (also the PR's `[PREVIEW-CHECK]` items)

On `pnpm run dev` locally, then on the PR preview:

1. Open `/technology/` at 320 px, 390 px and desktop, light and dark: the diagram is first, nothing
   is cut off, no sideways scroll, lines meet their boxes, labels read cleanly.
2. Tab through the diagram: focus ring visible on each part, order top to bottom; Enter moves to
   the entry and highlights part and entry; "Back to diagram" returns focus to the part.
3. Turn JavaScript off: every part link jumps to its entry; every explanation and source link is
   there.
4. Follow each source link: it opens a new tab on GitHub `main` at the right file or folder (a file
   added by this PR only resolves after merge).
5. Open `/technology/#worker-api` directly: the page opens at that entry with it highlighted.
6. Windows High Contrast / forced colours (or Chromium's emulation): parts, lines and focus visible.
7. Read every explanation against how the site works today (FR-013): nothing says the contact form
   stores messages; preview and production each have their own Worker and database.
