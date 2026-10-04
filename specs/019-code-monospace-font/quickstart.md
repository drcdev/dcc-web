# Quickstart: validating the code font

**Feature**: `019-code-monospace-font`. Contract rows are in
[contracts/code-font.md](./contracts/code-font.md); sizes and choices in
[research.md](./research.md).

## Prerequisites

- Node from `.nvmrc` (see `CLAUDE.md` "Local toolchain"); in a worktree use the pnpm shim
  wrapper.
- To regenerate fonts only: `uv` and `unzip` (the recipe downloads the JetBrains Mono 2.304
  release once into `.cache/fonts/`).
- For Linux baselines: Docker Desktop running.

## 1. Font files (unit)

```bash
pnpm exec vitest run --project unit tests/unit/site/font-files.test.ts tests/unit/site/font-coverage.test.ts
```

Expect: the four `JetBrainsMono-*.woff2` files match their pinned SHA-256, weights, styles and
cmaps; total ≤ 60,000 bytes (31,656 today); `OFL.txt` unmodified; the guard green for both
families (M10, M11, M19).

Reproducibility (recorded 2026-10-04): release
`https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip`,
archive SHA-256 `6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf`. Per face:
`uvx --from "fonttools[woff]==4.60.2" pyftsubset JetBrainsMono-<face>.ttf --unicodes=<INTER_UNICODE_RANGE> --layout-features= --no-hinting --flavor=woff2 --output-file=src/assets/fonts/jetbrains-mono/JetBrainsMono-<face>.woff2`.

| File | Bytes | SHA-256 |
|---|---|---|
| `JetBrainsMono-Regular.woff2` | 7,460 | `c7db62fa593d7a626f8eb77646a6f0944c01e3ba586ac3ceca55e8b36888bd18` |
| `JetBrainsMono-Italic.woff2` | 8,256 | `3e6abb338d565e42430dc0d7612f261eb92d62b89a1f77c021cc9e7daa5d9dc0` |
| `JetBrainsMono-Bold.woff2` | 7,544 | `504d5a6ee14ff269ca94e8c5d2b661c92a6cd3290c11735c7099fd5a71bc83c0` |
| `JetBrainsMono-BoldItalic.woff2` | 8,396 | `62e2d56f1471aa78550024fc0432303c351d9c4141ba7a5331b267c8c2015fdf` |
| `OFL.txt` | 4,399 | `30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad` |

Regenerate (only when upgrading the font): `node scripts/fonts/subset-jetbrains-mono.ts`, then
`git status src/assets/fonts/jetbrains-mono/` shows no change if the release is the same.

## 2. Config, tokens and head (unit, component)

```bash
pnpm exec vitest run --project unit tests/unit/site/astro-config.test.ts tests/unit/site/design-tokens.test.ts
pnpm exec vitest run --project unit tests/component/BaseLayout.test.ts
```

Expect M01–M05, M07, M08.

## 3. Build output (build)

```bash
pnpm run test:build
```

Expect eight hashed files in `dist/_astro/fonts/` (M09).

## 4. Browser (E2E, a11y, budget)

```bash
pnpm exec playwright test --project e2e tests/e2e/fonts.spec.ts tests/e2e/headers.spec.ts
pnpm run test:a11y
pnpm run test:budget
```

Expect M12–M17; zero a11y violations; every budget template within 153,600 bytes and CLS < 0.1.
Read the `writing-post` annotation (estimate ≈ 100,800 bytes, research R4) and record it in the
PR body.

## 5. Visual baselines

```bash
pnpm run test:visual:update          # macOS
pnpm run test:visual:update:linux    # Linux, in Docker
git status --short tests/e2e/visual.spec.ts-snapshots/
```

Expect exactly the eight `post-template-*` images modified (research R6), nothing else. Open
the PR without the `visual-baselines` label; the first CI visual run must pass.

## 6. Preview check (Don)

On the preview deployment, light and dark, phone and desktop: a post with code blocks and inline
code shows JetBrains Mono; prose and headings are still Inter; the Network panel shows mono files
only on pages with code, each from `/_astro/fonts/`, cached on reload.
