<!--
Sync Impact Report
==================
Version change: 1.1.0 → 2.0.0
Bump rationale: MAJOR. Principle VIII (Fly.io Best Practices) is removed and
replaced by a new Principle VIII (Cloudflare Best Practices), and Principle VII is
redefined: the contact API and its storage move from Fly.io in Toronto to
Cloudflare Workers and D1, dropping the Canada residency requirement. Principle IV,
Principle V and the Technology Constraints change accordingly. The amendment
request named the previous version as 1.0.0; the file was at 1.1.0 (the Astro
Docs MCP amendment), so the bump is applied from 1.1.0.

Modified principles:
- IV. First-Party Before Custom → IV. First-Party Before Custom (title unchanged;
  the first-party rule now names Cloudflare only)
- V. Static by Default → V. Static by Default (title unchanged; first bullet now
  states that the contact API under /api/ is the only server-side code)
- VII. Private Data: Minimal, Protected, in Canada → VII. Private Data: Minimal
  and Protected (redefined: storage is Cloudflare D1 in the location recorded in
  the contact feature's plan; IP addresses stored only as salted hashes; preview
  submissions kept separate from production; secrets in Cloudflare and GitHub)
- VIII. Fly.io Best Practices → VIII. Cloudflare Best Practices (replaced)

Added sections: none

Removed sections:
- VIII. Fly.io Best Practices (replaced by VIII. Cloudflare Best Practices)

Other changes:
- Technology Constraints: Hosting is now "Cloudflare Workers static assets";
  Contact API is now TypeScript in the site's Worker with D1 and a Cron Trigger.
- Every mention of Fly.io, fly.toml, Fly volumes, the Toronto region (yyz) and
  storing data in Canada is removed.

Templates reviewed (read at runtime, not modified by this command):
- .specify/templates/plan-template.md — the free-form Constitution Check
  accommodates the renamed Principle VII and the new Principle VIII without a
  structural change.
- .specify/templates/spec-template.md — no change required.
- .specify/templates/tasks-template.md — no change required.

Follow-up TODOs: none. No placeholders deferred. Earlier feature specs, plans and
docs/setup.md still describe Fly.io/Toronto storage and are out of scope for this
command (see the amendment's Next Actions).
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
- The official Astro documentation, retrieved through the Astro Docs MCP server
  (`astro-docs`), is the source of truth for every Astro development choice: project
  structure, configuration, content collections, routing, images, integrations, adapters,
  testing and deployment. Agents MUST consult it before deciding how to build an Astro
  feature, and MUST NOT rely on memory of older Astro versions or on third-party tutorials
  when the official docs cover the topic.
- If the Astro Docs MCP is unavailable, the agent MUST say so in the plan or task notes and
  fall back to the published docs at docs.astro.build. It MUST NOT silently proceed from
  memory.
- Where Astro provides a first-party feature or official integration, use it rather than
  building or adding an alternative. Examples: content collections with schemas, the built-in
  image handling, view transitions, official integrations for MDX, sitemap and RSS, and typed
  environment variables.
- The same rule applies to Cloudflare: use the platform's own feature before a third-party
  package or custom code.
- Custom code is allowed only when no first-party option meets the requirement. The plan must
  name the first-party option considered and say why it falls short.

### V. Static by Default

- Every public page is prerendered at build time. There is no server-side rendering for public
  content. The only server-side code is the contact API under `/api/`.
- Pages ship no client-side JavaScript unless a component genuinely needs interactivity.
  Interactive pieces are isolated islands loaded as late as possible.
- Core content (pages, posts, project stories) must be readable with JavaScript turned off.

### VI. Content as Files

- All public content lives in the Git repository as Markdown or MDX, validated by content
  collection schemas.
- Content must be easy for both Don and Claude Code to write and edit directly. There is no
  CMS and no database for public content.
- Invalid content fails the build with a clear error rather than rendering incorrectly.

### VII. Private Data: Minimal and Protected

- The only personal information the site collects is what a person types into the contact
  form.
- Collect only the fields that are needed. Never log message contents or personal details.
  Store only a salted hash of a sender's IP address, never the address itself.
- Contact submissions are stored only in Cloudflare D1, in the location recorded in the
  contact feature's plan. The privacy policy states where they are stored.
- Messages sent from preview deployments are stored separately from production messages.
- Stored submissions are deleted automatically after a set retention period.
- Secrets live in Cloudflare and GitHub secret stores and in gitignored local files. They are
  never committed, logged or included in client code.

### VIII. Cloudflare Best Practices

- Follow Cloudflare's documented best practices for Workers, D1 and Turnstile, covering
  deployment, security and performance.
- The site and the contact API run in one Worker. Only `/api/*` invokes Worker code; every
  other request is served as a static asset.
- Worker configuration, D1 migrations and Cron Triggers are committed and applied through CI,
  never by hand in the dashboard.
- The contact API accepts requests only from the site's own origin, verifies Turnstile
  server-side, rate-limits submissions, and serves HTTPS only.
- Usage stays within Cloudflare's free plan limits. D1 queries are indexed so they stay well
  under the free plan's daily row limits.

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
- **Hosting:** Cloudflare Workers static assets, serving the static build, with a preview
  deployment per branch.
- **Contact API:** TypeScript in the site's Worker, handling `/api/*`, with Cloudflare D1 for
  storage and a Cron Trigger for retention.
- **Spam protection:** Cloudflare Turnstile, verified by the contact API.
- **Analytics:** Cloudflare Web Analytics or none.
- **CI:** GitHub Actions.
- One package manager for the whole repository, with its lockfile committed.
- New tools, services or libraries outside this list require a major-change review.

## Development Workflow

- Plans must include a Constitution Check that confirms each principle above, or explains any
  exception in the plan's complexity section.
- Astro decisions cite the docs: when a plan or research note chooses an Astro approach
  (configuration, integration, API or pattern), it MUST name the Astro documentation page
  that supports the choice, as found through the Astro Docs MCP. A reviewer can then confirm
  the choice against the current docs rather than the agent's recollection.
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

**Version**: 2.0.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-09-29
