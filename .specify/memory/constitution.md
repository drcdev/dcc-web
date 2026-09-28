<!--
Sync Impact Report
==================
Version change: (template, unversioned) → 1.0.0
Bump rationale: initial ratification. All template placeholders replaced with
project-specific content; no prior principles existed to modify or remove.

Modified principles: none (initial adoption)

Added sections:
- Preamble (purpose of the site and how the constitution is applied)
- Core Principles I–XI:
  I. Test-First (NON-NEGOTIABLE)
  II. Automated Release Gate
  III. Human Review for Major Changes
  IV. First-Party Before Custom
  V. Static by Default
  VI. Content as Files
  VII. Private Data: Minimal, Protected, in Canada
  VIII. Fly.io Best Practices
  IX. Cost Ceiling
  X. Accessible, Fast and Private
  XI. Spec Kit Workflow
- Technology Constraints
- Development Workflow
- Governance

Removed sections: none (template placeholder slots for principles 1–5,
SECTION_2, SECTION_3 and GOVERNANCE_RULES were filled, not removed)

Templates reviewed (read at runtime, not modified by this command):
- .specify/templates/plan-template.md — Constitution Check section must be
  filled per Development Workflow; no structural change required.
- .specify/templates/spec-template.md — no change required.
- .specify/templates/tasks-template.md — task ordering rule (tests before
  implementation) is compatible with Principle I; no change required.

Follow-up TODOs: none. No placeholders deferred.
-->

# doncoleman.ca Constitution

The site is the public home for Don Coleman's writing, portfolio and consulting practice. It is
built almost entirely by AI agents (Claude Code) using Spec Kit, so these principles are written
to be applied without interpretation. When a plan or task conflicts with this document, this
document wins.

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

- Every change starts with tests that describe the expected behaviour. Tests are written,
  reviewed against the spec, and seen to fail before implementation begins.
- This applies to everything: content schemas, components, pages, the contact API, redirects,
  build configuration and deployment scripts.
- Test layers, using the tools each platform recommends:
  - Unit and schema tests for logic, utilities and content collection schemas.
  - Component tests for Astro components, using Astro's own testing support.
  - End-to-end tests in a real browser for user journeys (navigation, reading a post,
    submitting the contact form).
  - Automated accessibility checks on every page template.
  - Integration tests for the contact API against a real local database.
- A task is not done until its tests pass locally and in CI.

### II. Automated Release Gate

- Nothing reaches production unless the full test suite, type checks, linting, build and
  performance checks pass in CI.
- Production deploys happen only from the main branch, and only after CI passes.
- Every branch gets a preview deployment so changes can be seen running before they merge.
- A failed check blocks the merge. Checks are never skipped, disabled or weakened to get a
  change through; if a test is wrong, fixing it is its own reviewed change.

### III. Human Review for Major Changes

A major change needs Don's explicit approval on the pull request, after he has looked at the
preview deployment. A change is major if it:

- adds, removes or replaces a dependency, integration or external service;
- touches how contact data is collected, stored, retrieved or deleted;
- changes the design system, site-wide layout, navigation or visual identity;
- could increase running costs;
- changes CI, deployment or infrastructure configuration;
- amends this constitution.

All other changes may merge automatically once the release gate passes. When in doubt, treat
the change as major.

### IV. First-Party Before Custom

- Follow Astro's documented best practices for the current stable version.
- Where Astro provides a first-party feature or official integration, use it rather than
  building or adding an alternative. Examples: content collections with schemas, the built-in
  image handling, view transitions, official integrations for MDX, sitemap and RSS, and typed
  environment variables.
- The same rule applies to Cloudflare and Fly.io: use the platform's own feature before a
  third-party package or custom code.
- Custom code is allowed only when no first-party option meets the requirement. The plan must
  name the first-party option considered and say why it falls short.

### V. Static by Default

- Every public page is prerendered at build time. There is no server-side rendering for public
  content.
- Pages ship no client-side JavaScript unless a component genuinely needs interactivity.
  Interactive pieces are isolated islands loaded as late as possible.
- Core content (pages, posts, project stories) must be readable with JavaScript turned off.

### VI. Content as Files

- All public content lives in the Git repository as Markdown or MDX, validated by content
  collection schemas.
- Content must be easy for both Don and Claude Code to write and edit directly. There is no
  CMS and no database for public content.
- Invalid content fails the build with a clear error rather than rendering incorrectly.

### VII. Private Data: Minimal, Protected, in Canada

- The only personal information the site collects is what a person types into the contact
  form.
- Collect only the fields that are needed. Never log message contents or personal details.
- Contact submissions are stored only on Fly.io in the Toronto region (yyz). They do not pass
  through any service that stores them outside Canada.
- Stored submissions are deleted automatically after a set retention period.
- Secrets live in Fly.io and Cloudflare secret stores and in gitignored local files. They are
  never committed, logged or included in client code.

### VIII. Fly.io Best Practices

- Follow Fly.io's documented guidance for deployment, security and performance, including its
  production checklist.
- The contact API is configured in a committed `fly.toml`, pinned to the Toronto region, and
  scales to zero when idle, starting automatically on request.
- The container image is minimal, runs as a non-root user, and exposes a health check.
- The API accepts requests only from the site's own origins, verifies spam protection
  server-side, rate-limits submissions, and serves HTTPS only.
- Stored data is on a Fly volume with automatic snapshots enabled.

### IX. Cost Ceiling

- Total running costs for hosting, storage and services stay at or below $13 a month.
- Prefer free tiers that permit commercial use. Any change that could add a recurring cost is
  a major change and must state the expected monthly cost in its plan.

### X. Accessible, Fast and Private

- Every page meets WCAG 2.2 AA.
- Pages meet Core Web Vitals "good" thresholds on mobile. CI enforces a performance budget,
  and a change that breaks it fails the gate.
- No advertising, tracking cookies or third-party scripts, except privacy-focused analytics
  and the contact form's spam protection.

### XI. Spec Kit Workflow

- All feature work follows Spec Kit's built-in process: specify, clarify, plan, tasks,
  implement, analyze.
- Use Spec Kit's own branch and directory naming. Do not add custom conventions on top of it.
- One feature per branch. Parallel features run in separate git worktrees and must not edit
  the same files unless the plan says how conflicts will be handled.

## Technology Constraints

- **Site:** Astro (current stable), TypeScript in strict mode, Tailwind CSS.
- **Design baseline:** the existing Tailwind theme from Don's current site is ported as the
  starting design system. Deviations from it are major changes.
- **Hosting:** Cloudflare, serving the static build, with a preview deployment per branch.
- **Contact API:** a small TypeScript service on Fly.io (yyz) with a single SQLite database on
  a Fly volume.
- **Spam protection:** Cloudflare Turnstile, verified by the contact API.
- **Analytics:** Cloudflare Web Analytics or none.
- **CI:** GitHub Actions.
- One package manager for the whole repository, with its lockfile committed.
- New tools, services or libraries outside this list require a major-change review.

## Development Workflow

- Plans must include a Constitution Check that confirms each principle above, or explains any
  exception in the plan's complexity section.
- Tasks are ordered so tests come before the implementation they cover.
- Agents keep changes inside the feature's scope. Anything out of scope is noted in the spec
  as follow-up work, not done in passing.
- Writing on the site (placeholder copy, labels, error messages) is plain language, with no
  hype or filler.

## Governance

- This constitution overrides any other practice or instruction in the repository.
- Amendments are made through Spec Kit's constitution command, reviewed as a major change, and
  versioned:
  - MAJOR for removing or redefining a principle;
  - MINOR for adding a principle or materially expanding one;
  - PATCH for wording and clarifications.
- Every pull request review checks compliance with this document.

**Version**: 1.0.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-09-28
