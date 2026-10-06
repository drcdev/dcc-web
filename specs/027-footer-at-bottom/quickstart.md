# Quickstart: validating Footer at the Bottom

**Feature**: `027-footer-at-bottom` | **Plan**: [plan.md](./plan.md)

Run every command with node from `.nvmrc` (see `CLAUDE.md`, Local toolchain). Ask Don before the
full `pnpm run verify` gate.

## 1. Geometry (the primary check)

```sh
pnpm exec playwright test --project=e2e tests/e2e/geometry.spec.ts
```

Expect: every template at 320 x 640, 390 x 844 and 1280 x 800 passes. Before the layout change
the footer-placement assertion fails for `not-found` at every size; after it, all pass.

## 2. Visual baselines

```sh
pnpm run test:visual
```

Expect: only the four `not-found-*` full-page shots differ, with the footer moved to the bottom
of the window. Refresh them for macOS and Linux as described in
`.claude/skills/_shared/visual-baselines.md`. Any other diff (shell elements, sections fixture,
template subjects) is a regression to fix, not a baseline to refresh.

## 3. Accessibility and no-JS

```sh
pnpm exec playwright test --project=a11y
pnpm exec playwright test --project=e2e tests/e2e/no-js.spec.ts
```

Expect: no new axe violations; no sideways scroll with JavaScript off.

## 4. By eye (optional)

Build and preview, open `/nope/` in a tall window: the footer meets the bottom edge and the page
does not scroll. Open `/writing/sample-everything/`: the footer follows the content as before.

## 5. Full gate

`pnpm run verify` (after asking Don), then CI.
