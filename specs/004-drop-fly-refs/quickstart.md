# Quickstart: verify the Fly.io references are gone

Run every command from the repository root on branch `004-drop-fly-refs`.

## 1. Search for stale wording (FR-005, SC-001)

```sh
grep -rn -i -E "fly\.io|fly\.toml|fly volume|\byyz\b|canada|toronto" specs docs \
  | grep -v -E "^specs/004-drop-fly-refs/|^specs/003-standalone-pages/tasks\.md:"
```

- **Before the edits**: matches in the eight files listed in `plan.md`.
- **After the edits**: no output.

## 2. Check the principle titles (SC-002)

```sh
grep -n "Best Practices" specs/001-setup-walkthrough/plan.md specs/002-site-foundation/plan.md specs/003-standalone-pages/plan.md
grep -n "Private Data" specs/003-standalone-pages/plan.md docs/setup.md
```

Expected: the three Principle VIII rows say "Cloudflare Best Practices"; the two
`docs/setup.md` lines say "VII (Private Data: Minimal and Protected)"; the 003 plan's
Principle VII row does not name a city, country or region.

## 3. Check the diff scope (SC-003)

```sh
git diff --name-only main...HEAD
```

Expected: only the eight files in `plan.md`, files under `specs/004-drop-fly-refs/`, and
`.specify/feature.json`. In particular, not `specs/003-standalone-pages/tasks.md`,
`.specify/memory/constitution.md`, or anything under `src/` or `tests/`.

## 4. Confirm nothing else changed (SC-004)

```sh
pnpm run verify
```

Expected: passes with no test, snapshot or visual baseline changes (from an agent shell, set
`ASTRO_PREVIEW_BACKGROUND=1`; see the repository's toolchain notes).
