# Quickstart: validate the two-column contact page

## Prerequisites

- Node from `.nvmrc`. In every Bash call that runs `pnpm`, `astro`, `playwright` or `wrangler`,
  check `node -v` first and prefix `source ~/.nvm/nvm.sh && nvm use` if it is wrong (CLAUDE.md,
  Local toolchain). Bound long runs with `perl -e 'alarm N; exec @ARGV' …`.
- In a worktree, use the pnpm shim and wrapper described in the memory notes on verifying from an
  agent shell. Check `lsof -i :4321` and `:4322` first, because sibling worktrees share those ports.

## Fast checks while building

```sh
pnpm run verify:quick                                     # lint, types, unit, worker, build
pnpm exec vitest run tests/component/sections/ContactForm.test.ts \
  tests/unit/site/privacy-policy.test.ts tests/unit/content/site-pages.test.ts \
  tests/unit/site/fixture-posts.test.ts
```

Expected: the component rows L1–L11 and N1–N2 (`contracts/contact-page.md`) pass, the shown
address matches the privacy policy, and the fixture page check accepts `<ContactForm>`.

## Browser checks

```sh
pnpm exec playwright test tests/e2e/contact.spec.ts --project=e2e
pnpm exec playwright test --project=a11y -g "contact"
pnpm exec playwright test tests/e2e/geometry.spec.ts tests/e2e/no-js.spec.ts --project=e2e -g "contact"
pnpm exec playwright test --project=visual -g "contact form"
```

Expected:

1. At 1280 × 800, the note column is left of the form column, both tops are level (within 1 px),
   and the form column is wider. "Before you write" and the start of the form are visible
   without scrolling (SC-001, SC-005).
2. At 1023 and 375 px, the note's bottom edge is above the form column's top edge, and
   `scrollWidth <= clientWidth` (SC-002).
3. Tabbing from the top of `main` reaches GitHub, LinkedIn and the email link before Name.
4. Every existing journey passes unchanged. Valid send and `?project=` also pass at 375 px
   (SC-003).
5. Axe finds zero violations in both themes at both widths, idle and in the error, form-error and
   success states (SC-004).
6. The visual test fails on the eight `contact-form-*` baselines until they are refreshed. That
   is expected.

## Refresh the visual baselines

Follow `.claude/skills/_shared/visual-baselines.md`. Refresh only the `contact-form-*` subject:

- macOS: `pnpm run test:visual:update` (writes `*-darwin.png`).
- Linux: Docker Desktop must be running (`docker info`), then `pnpm run test:visual:update:linux`.
  Commit only the `contact-form-*-linux.png` files.

Changed files (8): `contact-form-{desktop,phone}-{light,dark}-visual-{darwin,linux}.png`. No other
baseline should change. If one does, stop and find out why.

## By eye on the preview ([PREVIEW-CHECK])

- `/contact/` at a laptop width: two columns, note left, form right, title above both.
- The note's wording (welcomed conversations, "within a few days", "Vancouver Island, BC — Pacific
  Time") reads as Don wants. It has no consulting offer and no job title.
- `/contact/?project=<a project slug>` shows the "About:" line in the form column.
- On a phone: one column, note first, no sideways scroll. Send a real test message once.
