# Quickstart: validating the career timeline

Prerequisites: Node from `.nvmrc` (see CLAUDE.md "Local toolchain"), dependencies installed. In a
worktree, use the pnpm shim described in the project memory. Docker Desktop only for the Linux
visual baselines.

## 1. Content and rules (fast)

```bash
pnpm run test:unit -- tests/unit/content/career-schema.test.ts tests/unit/content/career.test.ts \
  tests/unit/content/career-filter.test.ts tests/component/sections/CareerTimeline.test.ts
```

Expect every row of `contracts/build-errors.md` (T01–T11) to have a passing case, and the component
markup to match `contracts/timeline-markup.md`.

## 2. Build wiring

```bash
pnpm run test:build -- tests/build/career-timeline.test.ts
pnpm run build
```

Expect: the sync run fails naming a broken step file; the build run fails naming a step with a
missing post; the real build passes and `dist/about/index.html` holds seven `<details>` in reverse start
order (newest first), the first being the current role, all closed, with no filter visible in the HTML (`hidden`).

## 3. Journeys in a browser (fixture site, port 4322)

```bash
pnpm run test:e2e -- tests/e2e/career-timeline.spec.ts
```

Covers: open and close by mouse and keyboard; choose a category (matching steps open and marked,
others closed and muted, still on screen and openable, status line count; Volunteer opens the
volunteer steps and highlights no item; no Achievements choice); choose All (all closed,
none muted); JavaScript off (no filter, every step opens); 320 px with no horizontal scroll;
print emulation (all open, no muting); reduced motion; forced colours.

## 4. Accessibility, budget, visual

```bash
pnpm run test:a11y      # /about/ idle (existing template entry) + the filtered state on the fixture site
pnpm run test:budget    # /about/ stays in budget with the small inline script
pnpm run test:visual    # new career-timeline element shots on the fixture /about/
```

New baselines: `career-timeline-{phone,desktop}-{light,dark}` for darwin and linux. Create them with
`pnpm run test:visual:update` and `pnpm run test:visual:update:linux` (Docker), per
`.claude/skills/_shared/visual-baselines.md`. No existing baseline should change.

## 5. Manual check on the preview (Don)

- `/about/`: timeline sits after "About me", the "Leadership" line is gone, "Recognition" is
  unchanged.
- The seven steps and their text match spec FR-006a word for word.
- Labels read well ("Scope", "Key decision", the list headings, the filter label and status line).
- The muted treatment (tint and dashed left rule, FR-011a) looks deliberate in light and dark mode, and the disclosure marker sits on the role title's line.
- The current job title appears nowhere outside `/about/`.
