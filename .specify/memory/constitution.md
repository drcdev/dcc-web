<!--
Sync Impact Report
==================
Version change: 2.1.0 → 2.2.0
Bump rationale: MINOR. Principle V is materially expanded: the server-side code
allowed under `/api/` grows from the contact API alone to a named list of
first-party endpoints, each stated with its data and limits, and a second
endpoint (the critical-thinking questions API) is added to it. No principle is
removed or redefined; the contact API's rules are unchanged. Source: feature
022-critical-thinking-questions (spec "Dependencies and Governance").

Modified principles:
- I. Test-First — "the contact API" generalised to "the API endpoints" in the
  scope list and the integration-test layer.
- V. Static by Default — the single-endpoint sentence replaced by the named
  endpoint list (contact API; critical-thinking questions API), with the rule
  that adding an endpoint is an amendment.
- VIII. Cloudflare Best Practices — Workers AI added to the best-practice
  list; "the site and the contact API run in one Worker" generalised to the
  site's API endpoints; the origin/HTTPS rule now applies to every endpoint,
  with each endpoint's own abuse limits stated.

Added sections: none

Removed sections: none

Other changes:
- Technology Constraints: new "Questions API" line (Workers AI through the
  Worker's `ai` binding, D1 for cached question sets and the usage bucket).
- Ratified stays 2026-09-28; Last Amended is 2026-10-04.

Templates reviewed (read at runtime, not modified by this command):
- .specify/templates/plan-template.md — no change required (its Constitution
  Check gate reads the principles at runtime).
- .specify/templates/spec-template.md — no change required.
- .specify/templates/tasks-template.md — no change required for this amendment
  (the earlier layer-field TODO still stands).

Follow-up TODOs:
- Add a layer field to the tasks template and speckit-tasks (carried from 2.1.0).
- Principle I's layer list does not yet name build, visual or budget tests
  (carried from 2.1.0).
No placeholders deferred.
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
- This applies to everything: content schemas, components, pages, the API endpoints,
  redirects, build configuration and deployment scripts.
- Test layers, using the tools each platform recommends:
  - Unit and schema tests for logic, utilities and content collection schemas.
  - Component tests for Astro components, using Astro's own testing support.
  - End-to-end tests in a real browser for user journeys (navigation, reading a post,
    submitting the contact form).
  - Automated accessibility checks on every page template.
  - Integration tests for each API endpoint against a real local database.
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
  content. The only server-side code is the API endpoints under `/api/` named below, each with
  its data and limits. Adding an endpoint is an amendment to this list.
  - **Contact API:** receives and stores contact form submissions, the site's only personal
    data (Principle VII), and lets Don retrieve them. It verifies Turnstile and rate-limits each
    sender.
  - **Critical-thinking questions API:** handles no personal data and identifies no reader. It
    generates questions only for the site's own posts, never for text a caller supplies, through
    the Workers AI binding. It caches each post version's question set in D1 (derived output,
    not authored content, so Principle VI still holds) and serves a cached set at no cost. Every
    generation draws from one site-wide token bucket per environment, stored in D1 and sized in
    one configuration module.
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

- Follow Cloudflare's documented best practices for Workers, D1, Turnstile and Workers AI,
  covering deployment, security and performance.
- The site and its API endpoints run in one Worker. Only `/api/*` invokes Worker code; every
  other request is served as a static asset.
- Worker configuration, D1 migrations and Cron Triggers are committed and applied through CI,
  never by hand in the dashboard.
- Every API endpoint accepts requests only from the site's own origin and serves HTTPS only.
  The contact API also verifies Turnstile server-side and rate-limits submissions. The
  questions API is limited by its site-wide bucket and calls no model when the bucket is empty.
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
- **Questions API:** TypeScript in the same Worker, Cloudflare Workers AI through the Worker's
  `ai` binding, and Cloudflare D1 for cached question sets and the usage bucket.
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
- Test placement: every behaviour gets one primary layer, the cheapest layer that can observe
  it. End-to-end tests are for journeys and for anything only a browser can show; build tests,
  which run the real `astro build`, are for what only the real build can show; accessibility
  and visual checks cover page templates, not each user story. Every test task names its
  layer, and testing the same behaviour at a second layer needs a written reason.
  `docs/testing.md` ("Where a test goes") holds the working detail.
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

**Version**: 2.2.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-10-04
