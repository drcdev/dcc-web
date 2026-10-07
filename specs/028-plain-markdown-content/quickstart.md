# Quickstart: validating 028 (plain Markdown content)

Run from the feature worktree. Follow the Local toolchain section of `CLAUDE.md` (node from
`.nvmrc`; `perl -e 'alarm N; exec @ARGV'` for long runs). Ask Don before the full
`pnpm run verify` gate.

## 1. Unit, component and docs checks

```sh
pnpm exec vitest run tests/unit/content/body.test.ts tests/unit/content/section-schemas.test.ts \
  tests/unit/content/launch-content.test.ts tests/unit/site/docs-content-structure.test.ts
```

Expected: green. The removed tags are rejected with the "is not a section" message
(`contracts/content-rules.md` C2); the Work with me source has only `Lead` and `CallToAction`
tags and its `##`/`###` structure (C4); the guides match C5.

## 2. Build and heading ids

```sh
pnpm run build
grep -o '<h[23] id="[^"]*"' dist/work-with-me/index.html
```

Expected: twelve lines, `speaking-topics` through `what-i-dont-do` (research R1). Then run the
build test: `pnpm exec vitest run tests/build/local-site.test.ts` (green).

## 3. Manual rejection check (optional)

Add `<TextBlock title="x">\n\ntext\n\n</TextBlock>` to any page file and run `pnpm run build`.
Expected: the build fails naming the file and `<TextBlock>` and listing the eight sections.
Revert the edit.

## 4. Browser checks

```sh
pnpm exec playwright test --project=sections --project=a11y
```

Expected: green. Open `/work-with-me/#consulting` on a preview or `pnpm run preview`: the page
scrolls to "Consulting".

## 5. Visual baselines

Only the `sections-*` shots change (research R5). Refresh them as
`.claude/skills/_shared/visual-baselines.md` describes, then confirm
`pnpm run test:visual` is green and no other PNG changed (`git status tests/e2e/visual.spec.ts-snapshots`).
