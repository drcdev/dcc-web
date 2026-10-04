# Quickstart: Inter text in diagrams and the sharing image

How to check the feature end to end. Contracts: [diagram-svg.md](./contracts/diagram-svg.md),
[scripts.md](./contracts/scripts.md). Data: [data-model.md](./data-model.md).

## Prerequisites

- Node from nvm at the `.nvmrc` version (`node -v`; if not, `source ~/.nvm/nvm.sh && nvm use` in
  the same command).
- `uv` for the hand-run font step only (`uvx --version`; `brew install uv`). CI never needs it.
- Playwright's Chromium (`pnpm exec playwright install chromium`) for the sharing image and E2E.

## 1. The gate rules (unit)

```bash
pnpm exec vitest run --project unit tests/unit/site/diagram-fonts.test.ts tests/unit/site/og-image.test.ts
```

Expected: every diagram under `src/content/` passes D01 to D08; the self-checks (D10) pass; the
sharing-image rows O01 to O03 pass.

## 2. Diagrams draw in Inter and fit (E2E)

```bash
pnpm exec playwright test --project=e2e tests/e2e/diagram-fonts.spec.ts
```

Expected: for each diagram, the Inter faces it uses are loaded and every label sits inside its box
with at least 16 units each side (D11, D12).

## 3. Edit a label (the documented path, docs/projects.md)

1. Change the wording of one `<text>` in a diagram file, for example add `é` to a copy of the
   template starter.
2. Run the unit test from step 1: it fails with
   `…: U+00E9 é is not in the embedded Inter Regular glyphs; run pnpm run fonts:diagrams -- …`
   (only if the character is in the site's Inter set is the fix the script; `é` is, `Ā` is not).
3. Run `pnpm run fonts:diagrams -- <file>`; the script prints the bytes before and after.
4. Re-run step 1: it passes. Run it again with no edit: `git diff` shows no change (S07).
5. Revert the experiment.

A diagram that asks for a system font (`font-family="system-ui, sans-serif"` anywhere) fails D01
or D02 with the file named.

## 4. Sharing image (by hand, once)

```bash
node scripts/og-image/render.ts
```

Expected: `Wrote 1200×630 sharing image to public/og-default.png`, and the PNG shows "Don Coleman"
in Inter Bold. If the face cannot load, the script throws and writes nothing.

## 5. Budget and size record (FR-011)

```bash
pnpm run build
pnpm exec playwright test --project=budget --workers=1 -g "project-story template"
wc -c src/content/projects/images/*/*.svg
```

Copy the `budget` annotation's `totalBytes` and each file size into the plan's FR-011 table.

## 6. Preview checks (`[PREVIEW-CHECK]`, Don)

On the PR's preview deployment:
- Each published project story: the architecture diagram labels are Inter (compare the `g`, `a`
  and `t` shapes with the story text), bold titles, regular details, all inside their boxes; open
  the diagram image on its own in a new tab and check the same, in Safari and in Chrome or
  Firefox.
- `/og-default.png`: "Don Coleman" in Inter Bold, rust on dusk, rule underneath, same size.
- The visual baselines did not change, and a11y passes on the project story template.
