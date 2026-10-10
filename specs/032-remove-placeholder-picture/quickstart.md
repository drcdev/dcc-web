# Quickstart: validate the placeholder removal

Prerequisites: Node 24 via nvm (see `CLAUDE.md` Local toolchain); run toolchain commands through
the nvm/shim wrapper. Ask Don before the full `pnpm run verify` gate.

## 1. Nothing still sets the key

```sh
grep -rn "placeholder:" src/content tests/fixtures tests/component tests/unit/content   # expect no output
grep -rn "data-placeholder\|data-visual-mark" src tests                                 # expect no output
grep -n -i "placeholder" docs/projects.md                                               # expect no output
```

## 2. Schema rejects the setting (US1, FR-001/002)

```sh
pnpm exec vitest run tests/unit/content/project-schema.test.ts
```

Expected: the new `placeholder` rejection cases pass (issue text names `placeholder` for list and story pictures,
image and diagram, `true` and `false`).

## 3. No mark on pictures (US2, FR-003/004)

```sh
pnpm exec vitest run tests/component/project/PartPicture.test.ts tests/build/local-site.test.ts
```

Expected: no "Placeholder" text or `data-placeholder` in the rendered figure or in the built
`/projects/every-part/` page; alt text, diagram description and eager/lazy loading unchanged.

## 4. Broken fixtures fail for their own reason (FR-005)

```sh
pnpm exec vitest run tests/build/project-validation.test.ts
```

Expected: every run passes with its original expected message.

## 5. Visual baselines (FR-007)

Follow `.claude/skills/_shared/visual-baselines.md`. After `pnpm run test:visual:update` (macOS)
and `pnpm run test:visual:update:linux` (Docker), `git status` shows exactly the eight
`story-template-*-visual-{darwin,linux}.png` files changed, and no `project-row-*` file.

## 6. Published content unchanged (FR-008)

`pnpm run build` succeeds; the real project pages and index rows render as before (the full gate,
including the projects e2e and a11y specs, passes).
