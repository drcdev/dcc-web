# Quickstart: validate page container harmony (050)

Follow the Local toolchain rules in `CLAUDE.md` for every command (check `node -v` against
`.nvmrc`; `source ~/.nvm/nvm.sh && nvm use` in the same command if needed; bound long runs with
`perl -e 'alarm N; exec @ARGV'`). Ask Don before the full `pnpm run verify` gate.

## 1. Tests fail first (before the component change)

```sh
pnpm exec vitest run tests/component/NotFound.test.ts      # parity test fails: 404 has no #content-section
pnpm exec playwright test tests/e2e/content-card.spec.ts --project=e2e   # light padding 0, no border
pnpm exec playwright test tests/e2e/theme-tokens.spec.ts --project=e2e  # light border transparent
```

Expected: the new assertions fail; nothing else does.

## 2. After the change

Run the same three commands: all pass. Then the neighbours that must stay green:

```sh
pnpm exec vitest run tests/component/PageLayout.test.ts
pnpm exec playwright test tests/e2e/geometry.spec.ts tests/e2e/sections.spec.ts tests/e2e/a11y.spec.ts
```

## 3. Visual baselines

Read `.claude/skills/_shared/visual-baselines.md` first. Run the visual project; only the images
listed in research R7 (not-found, sections, home-now-start-here, contact-form) may differ. Then
`pnpm run test:visual:update` (macOS) and `pnpm run test:visual:update:linux` (Docker), and check
that the diff touches only those 32 files (16 per platform).

## 4. By eye (also the PR's `[PREVIEW-CHECK]`)

On the preview (or `pnpm run preview`): open `/about/` and `/does-not-exist/` at phone and desktop
width, switch theme with the header toggle. Expected: a white card with a fine border and soft
shadow in light, the dusk card with a dark border in dark, and the text does not move when
switching. Check the home page and `/contact/` too.
