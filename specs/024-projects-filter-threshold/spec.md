# Feature Specification: Projects Filter Threshold

**Feature Branch**: `024-projects-filter-threshold`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Hide the projects theme filter until there are more than 10 published projects (Closes #100)". GitHub issue #100; Don's decision in the issue comment of 2026-10-04: keep the theme filter, but show it only when the projects index lists more than 10 projects.

## Context

The projects index lists every published project as a row, and each row already shows its
theme pills. Above the list sits a theme filter: a row of buttons, one per theme, with a
status line that says how many projects are shown. The index has five projects and eleven
themes, so almost every button narrows the list to one row the reader can already see. The
filter adds controls and a script without helping anyone yet.

The filter stays in the codebase. It appears only once the index lists 11 or more projects.
At 10 or fewer, the index is a plain list: no filter buttons, no status line, no "no projects
match" message, and no filter script.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A short projects list without the filter (Priority: P1)

A reader opens the projects index while it lists 10 or fewer projects. They see the heading,
the introduction and every project row with its theme pills. There are no filter buttons and
no status line, and the page loads no filter script.

**Why this priority**: This is the change. It is what readers see today and for as long as
there are 10 or fewer projects.

**Independent Test**: Build the site with 10 or fewer published projects and check the index
HTML for filter controls and the filter script; open it in a browser and check every row is
listed.

**Acceptance Scenarios**:

1. **Given** the index lists 10 or fewer projects, **When** a reader opens it, **Then** every
   project row is listed with its theme pills, and the page has no filter buttons, status line
   or "no projects match" message.
2. **Given** the index lists 10 or fewer projects, **When** the page is built, **Then** its HTML
   contains no filter markup and loads no filter script.
3. **Given** the index lists 10 or fewer projects, **When** a reader opens an old shared
   address such as `/projects/?theme=tooling` or `/projects/?theme=nonsense`, **Then** they see
   the full index, every row visible, and no error or empty message.
4. **Given** the index lists 10 or fewer projects, **When** a reader views it, **Then** each
   project row looks exactly as it does today.

---

### User Story 2 - The filter returns when the list grows (Priority: P2)

Once the index lists 11 or more projects, the theme filter appears and works as it does today:
buttons per theme, the status line, the shareable `?theme=` address and the "no projects
match" message.

**Why this priority**: It keeps Don's decision to keep the filter for a longer list. No reader
sees it until an eleventh project is published.

**Independent Test**: Render the index's project list with 11 projects and confirm the filter
markup and its controls are present; render it with 10 and confirm they are absent.

**Acceptance Scenarios**:

1. **Given** 11 or more projects, **When** the index is rendered, **Then** the filter markup is
   present exactly as it is today.
2. **Given** exactly 10 projects, **When** the index is rendered, **Then** no filter markup is
   present.

---

### Edge Cases

- **Exactly 10 projects**: no filter (the rule is "more than 10").
- **Exactly 11 projects**: filter shown.
- **No projects**: the existing empty-index message is unchanged.
- **Draft projects in a non-production build**: the count is the number of projects the index
  actually lists in that build, so the same rule decides in every build.
- **JavaScript off**: below the threshold the page is the same with or without script.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The projects index MUST show the theme filter only when it lists more than 10
  projects. The threshold is one named value in one place.
- **FR-002**: At 10 or fewer projects, the built index MUST contain no filter controls, status
  line or empty-filter message, and MUST load no filter script.
- **FR-003**: At 10 or fewer projects, every project row MUST be listed and look as it does
  today, including its theme pills, and a `?theme=` value in the address MUST have no effect.
- **FR-004**: At 11 or more projects, the theme filter MUST render and behave as it does today.
- **FR-005**: Tests MUST cover both sides of the threshold (10 projects: no filter; 11
  projects: filter present).

### Accessibility

The index MUST continue to meet WCAG 2.2 AA (Constitution Principle X) at 10 or fewer projects
and at 11 or more. Below the threshold the page loses an interactive group and a live region;
the list, headings, links and theme pills keep their current structure and contrast. Existing
automated accessibility checks on the fixture index, including the `?theme=` addresses, keep
passing.

### Constraints

- The change MUST NOT edit the shared test helpers or fixtures (`tests/e2e/templates.ts`,
  `tests/e2e/csp-violations.ts`, `tests/component/html.ts`, `tests/fixtures/`) or the
  Playwright or Vitest configuration, and MUST NOT add a new end-to-end spec file.
- The fixture site holds five fixture projects, below the threshold, so no browser test can
  see the filter after this change. The "above the threshold" side is covered without a
  browser, at the cheapest layer that can observe it.
- Static theme pills on each row stay as they are.
- No new copy is introduced.

### Appearance and visual baselines

- The live projects index changes appearance: with five projects, the filter buttons and the
  status line no longer appear above the list.
- No visual baseline is predicted to change. The visual suite captures the fixture index only
  as individual project rows (minimal, every setting, draft, in progress, retired), not the
  filter or the full page, and the rows must look the same. Those shots currently wait for the
  filter to be ready before capturing; that wait has to change, but the pixels must not. Any
  row baseline that does change is a regression to fix, not a baseline to refresh.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With today's five projects, the built projects index contains zero filter
  controls and zero filter scripts.
- **SC-002**: A test passes for 10 projects (no filter) and for 11 projects (filter present).
- **SC-003**: Visiting the index with any `?theme=` value at 10 or fewer projects shows every
  project row.
- **SC-004**: All existing visual baselines pass unchanged, and the accessibility checks on the
  fixture index report zero violations.

## Assumptions

- "Published projects" means the projects the index lists in that build. In production that is
  the published projects; on the fixture site and in development, drafts listed there count.
- The filter's code and styles stay in the repository for when the threshold is passed; only
  whether the index renders it changes.
- Existing browser tests that exercise the filter on the fixture site (five projects) can no
  longer reach it. They are retired or rewritten to assert the plain list; the filter's own
  behaviour stays covered by its existing unit and component tests.
- Not a major change under Principle III: no dependency, design system, layout, navigation,
  cost or infrastructure change. Principle V favours it (less client script).

## Follow-up (out of scope)

- If the filter's browser behaviour needs end-to-end coverage again before an eleventh real
  project exists, that needs more fixture projects, which is a larger change (a /deliver).
