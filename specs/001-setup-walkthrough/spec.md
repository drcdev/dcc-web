# Feature Specification: Setup Walkthrough and Setup Check

**Feature Branch**: `001-setup-walkthrough`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Walk Don through setting up everything the site needs before it can be built and deployed, and give him a way to confirm the setup is complete at any time. Don needs: a step-by-step walkthrough he can follow once, with each step explaining what it is for, where to do it, and how to confirm it worked; the walkthrough to pause at each step that needs him, and continue once he confirms; a single check he can run at any time that reports which parts of the setup are complete, which are missing, and what to do about each missing part; the setup documented in the repository, so it can be repeated or audited later; no secret value ever shown in the chat, written to the repository, or printed in logs. Setup covered by this slice: the code repository, with the main branch protected so changes can only merge when automated checks pass, and major changes also need Don's approval; the hosting account and project for the site, with preview links for branches; the domain's DNS managed by the hosting provider, while the live site keeps pointing at the current Ghost site until launch; a temporary address for the new site (for example a subdomain) so it can be reviewed before launch; the automated check and deployment pipeline's variables and secrets; privacy-respecting visitor statistics. Out of scope: the contact service setup (done in the contact feature) and switching the live domain (done at launch)."

## Context

This is the first feature in the repository and a bootstrap slice. The repository currently holds only the constitution, Spec Kit tooling and a `.gitignore`. There is no package manifest, no automated check pipeline, and no local `verify` gate (the single local command that mirrors what CI runs). This slice is responsible for establishing the minimum of each that it needs: the setup check itself must be tested (Principle I), those tests must run locally through the `verify` gate and in CI (Principle II), and branch protection needs at least one real automated check to require.

The constitution fixes the providers this setup targets: the code lives on GitHub, CI runs on GitHub Actions, the site is hosted on Cloudflare (Workers with static assets, built and deployed by Workers Builds, with per-branch preview URLs), DNS moves from Squarespace to Cloudflare, and visitor statistics use Cloudflare Web Analytics. The user stories refer to them by role ("the code host", "the hosting provider"). The setup-item requirements (FR-013 to FR-022) name the specific providers and products that were fixed during clarification, because those names define what the check confirms.

## Clarifications

### Session 2026-09-28

- Q: How should major-change pull requests get an approval that GitHub will count, given that GitHub does not let an author approve their own pull request? → A: Machine account. Agents open pull requests as a separate GitHub machine user (for example `dcc-bot`) with write access, and Don is the required code-owner reviewer.
- Q: Which Cloudflare hosting product and deploy trigger should the site use for production and per-branch previews? → A: Cloudflare Workers with static assets, deployed by Cloudflare's Git integration (Workers Builds). Main deploys to production and every other branch gets a preview URL. No Cloudflare deploy token is stored in GitHub.
- Q: Should this slice move the whole domain's DNS to Cloudflare now, or keep DNS where it is until launch? → A: Move the nameservers to Cloudflare now. The domain is registered and DNS-hosted at Squarespace today. Squarespace stays as registrar only (Cloudflare Registrar does not sell .ca). Every existing record is copied to Cloudflare and checked against the originals before the switch, and Ghost keeps working unchanged.
- Q: What subdomain should the pre-launch review address use? → A: `new.doncoleman.ca`.
- Q: How should visitor statistics be set up in this slice? → A: Cloudflare Web Analytics, turned on now for `new.doncoleman.ca` with automatic (script-free) setup, because the zone will be on Cloudflare. The check confirms it is on, and production counting carries over at launch.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check setup status at any time (Priority: P1)

Don runs one check from the repository. It looks at every part of the setup covered by this slice and prints a short report: each item is marked complete or missing, and each missing item has a one-line explanation of what to do and a pointer to the matching walkthrough step. The check never shows a secret value; for secrets it only confirms that a value with the expected name exists.

**Why this priority**: The check is the thing Don (and later agents) will use repeatedly, before every feature and before launch. It also defines, in testable form, what "setup complete" means, so the walkthrough in Story 2 can be built around it.

**Independent Test**: With nothing set up, run the check and confirm every item is reported missing with a next action. Complete one item by hand (for example, add a required pipeline secret), run the check again, and confirm only that item flips to complete.

**Acceptance Scenarios**:

1. **Given** a fresh clone and no setup done, **When** Don runs the check, **Then** every setup item is listed as missing, each with what to do and which walkthrough step covers it, and the check ends with a non-success result.
2. **Given** every setup item is complete, **When** Don runs the check, **Then** every item is listed as complete and the check ends with a success result.
3. **Given** a required pipeline secret exists, **When** the check reports on it, **Then** the report says the secret is present and shows its name only; no part of its value appears in the output or in any log.
4. **Given** the check cannot reach a provider (no network, expired or missing credentials), **When** Don runs it, **Then** the affected items are reported as "could not check" with the reason and how to fix access, rather than as complete or silently skipped.
5. **Given** some items are complete and some are missing, **When** Don runs the check, **Then** the summary line states how many items are complete out of the total.

---

### User Story 2 - Guided first-time setup (Priority: P2)

Don starts the walkthrough once. It takes him through each setup item in a safe order. For every step it explains what the step is for, where to do it (which site or screen, or which command to run), and how to confirm it worked. When a step needs Don to act (sign in, click through a provider's screens, paste a secret into a provider's secret store), the walkthrough stops and waits. When Don says he is done, the walkthrough confirms the step using the same logic as the setup check, then moves on. Steps already complete are recognised and skipped with a note.

**Why this priority**: Don only does this once, but without it he would have to work out the order and details himself. It depends on the check from Story 1 to confirm each step.

**Independent Test**: Start the walkthrough with one item already complete and the rest missing. Confirm it skips the complete item, stops at the first missing one with a what/where/how-to-confirm explanation, refuses to move on if Don says "done" but the confirmation fails, and continues once the confirmation passes.

**Acceptance Scenarios**:

1. **Given** no setup done, **When** Don starts the walkthrough, **Then** it shows the full list of steps in order, then begins with the first one.
2. **Given** a step that needs Don, **When** the walkthrough reaches it, **Then** it explains what the step is for, where to do it and how it will be confirmed, and waits for Don.
3. **Given** Don says a step is done, **When** the confirmation for that step fails, **Then** the walkthrough says what it found, suggests the likely fix and stays on that step.
4. **Given** Don stops part way, **When** he starts the walkthrough again later, **Then** it picks up at the first incomplete step without redoing completed ones.
5. **Given** a step that involves a secret, **When** the walkthrough reaches it, **Then** it tells Don to enter the value directly into the provider's secret store (or a gitignored local file) and never asks him to paste the value into the chat.

---

### User Story 3 - Repeatable, auditable setup record (Priority: P3)

The setup is written down in the repository as plain-language documentation: each item, why it exists, where it is configured, what "complete" looks like, and which constitution principle it serves. The documentation lists secret and variable names and where they live, never their values. Someone repeating the setup (for example after rotating a secret or moving accounts), or auditing it, can follow the document without the walkthrough.

**Why this priority**: Valuable for later audits and recovery, but not needed to get the site building. It shares its content with the walkthrough, so it is cheap once Stories 1 and 2 exist.

**Independent Test**: Read the setup document on its own and confirm that every item the check reports on appears in it with purpose, location and confirmation, and that no secret value appears anywhere in the repository.

**Acceptance Scenarios**:

1. **Given** the setup document, **When** it is compared with the items the check reports on, **Then** every check item has a matching documented step and vice versa.
2. **Given** the repository, **When** it is scanned for secret values, **Then** none are found; only secret names appear.

---

### Edge Cases

- **Existing DNS records**: Before the nameservers at Squarespace are changed to Cloudflare's, every existing record at Squarespace (the Ghost site, email records such as MX, SPF, DKIM and DMARC, and any verification records) must be copied to Cloudflare. The walkthrough must have Don compare the imported records against the Squarespace originals, and they must match, before the nameservers change, so the live site and email keep working.
- **Squarespace-only records**: Some records may be managed by Squarespace itself (for example its own defaults or domain-connect entries). The comparison must flag any record that exists at Squarespace but not at Cloudflare, and Don must decide on each one before the switch.
- **Nameserver change in progress**: DNS delegation can take hours to take effect. The check reports this as "pending" with an explanation, not as missing.
- **Live domain accidentally switched**: If the check finds the live domain pointing at the new site instead of the Ghost site before launch, it reports this as a problem, not as complete.
- **Temporary address exposed to search engines**: The temporary review address must not be indexed; the check reports if it is publicly indexable.
- **Secret names drift**: If the pipeline expects a secret name that is not documented, or the document lists one the pipeline no longer uses, the check or its tests flag the mismatch.
- **Sole maintainer approval**: GitHub does not let an author approve their own pull request. Agents therefore open pull requests as a separate machine account, so Don's review counts. If a pull request is opened from Don's own account by mistake, the check or the walkthrough must explain that Don's approval will not count, and the pull request must be reopened from the machine account.
- **Partially configured branch protection**: If protection exists but does not require the automated checks, or allows bypass, the check reports exactly which rule is missing.
- **Check run in CI versus locally**: Provider-side items that need Don's credentials may not be checkable in CI; the check must say which items it skipped and why, and must not fail CI because of them unless CI is meant to verify them.

## Requirements *(mandatory)*

### Functional Requirements

**Setup check**

- **FR-001**: The repository MUST provide a single command that checks every setup item in this slice and reports each as complete, missing, pending or could-not-check.
- **FR-002**: For each item that is not complete, the check MUST say what to do next and name the matching walkthrough and documentation step.
- **FR-003**: The check MUST end with a success result only when every item is complete, and a non-success result otherwise, so it can be used as a gate.
- **FR-004**: The check MUST be read-only: it never changes any setting in the repository host, hosting provider, DNS or pipeline.
- **FR-005**: The check MUST confirm secrets by name only and MUST NOT read, print, log or store any secret value.
- **FR-006**: The check's logic MUST be covered by automated tests that run without real provider accounts (using recorded or simulated provider responses), written and seen to fail before the check is implemented.

**Guided walkthrough**

- **FR-007**: The repository MUST provide a guided walkthrough covering every setup item, in an order that avoids breaking the live site (DNS records copied and compared before nameservers change).
- **FR-008**: Each walkthrough step MUST state what it is for, where to do it, and how it will be confirmed.
- **FR-009**: The walkthrough MUST pause at every step that needs Don and continue only after Don confirms and the step's confirmation passes.
- **FR-010**: The walkthrough MUST use the same confirmation logic as the setup check, so the two cannot disagree.
- **FR-011**: The walkthrough MUST be resumable: re-running it skips completed steps and starts at the first incomplete one.
- **FR-012**: The walkthrough MUST NOT ask Don to type, paste or reveal a secret value in the chat; it directs him to enter secrets directly into the provider's secret store or a gitignored local file.

**Setup items covered**

- **FR-013**: *Code repository*: the main branch MUST be protected so that changes merge only through pull requests, only when the required automated checks pass, and without force-pushes, deletion or admin bypass. Agents MUST open pull requests as a dedicated GitHub machine account (for example `dcc-bot`) with write access, separate from Don's account. The check MUST confirm that the machine account has access.
- **FR-014**: *Major-change approval*: a pull request identified as a major change (as defined by constitution Principle III) MUST NOT be mergeable without Don's explicit approval, given as a required code-owner review from Don's account; other pull requests may merge once checks pass.
- **FR-015**: *Automated check pipeline*: the repository MUST have a pipeline that runs on every pull request and on main, runs the same `verify` gate that runs locally, and reports a named check that branch protection requires.
- **FR-016**: *Local verify gate*: the repository MUST have a single local `verify` command that mirrors what the pipeline runs. For this slice it covers at least the setup check's tests, type checks and linting; later features extend it (build, end-to-end, accessibility, performance) without replacing it.
- **FR-017**: *Hosting*: a Cloudflare account and a Worker with static assets MUST exist, connected to the repository through Workers Builds. Workers Builds MUST deploy main to production and upload every other branch as a version with its own preview URL. Because main is protected (FR-013), production only ever deploys code that has passed the required checks.
- **FR-018**: *Deployable placeholder*: so that previews can be confirmed, the slice MUST deploy a minimal placeholder page; the real site is built by later features.
- **FR-019**: *DNS*: in this slice, the domain's nameservers MUST move from Squarespace to Cloudflare, with Squarespace kept as registrar only. Every existing record MUST be copied to Cloudflare and checked against the Squarespace originals before the nameserver switch, so the live domain still serves the current Ghost site, unchanged, and email still works.
- **FR-020**: *Temporary address*: the review address `new.doncoleman.ca` MUST serve the new site's production deployment over HTTPS as a custom domain on the Worker, and MUST ask search engines not to index it.
- **FR-021**: *Pipeline variables and secrets*: every variable and secret the pipeline needs for this slice MUST be defined by name in the pipeline's secret store, documented by name and purpose, and confirmed by the check without exposing values. Deployment credentials MUST be scoped to the minimum permissions needed. Deployment runs in Workers Builds, so no Cloudflare deploy token is stored in GitHub. The machine account's credential lives only in the agent's local sign-in or a gitignored file, never in the repository.
- **FR-022**: *Visitor statistics*: Cloudflare Web Analytics MUST be turned on for `new.doncoleman.ca` using automatic setup (no script added to the page, no cookies, no personal data), and the check MUST confirm it is on. Production counting carries over to the live domain at launch.

**Documentation and secrets**

- **FR-023**: The setup MUST be documented in the repository in plain language, one section per setup item, with purpose, location, confirmation, the constitution principle it serves, and the names (never values) of any secrets involved.
- **FR-024**: No secret value MAY be committed to the repository, shown in the chat, or printed in any log (local, pipeline or deployment). The verify gate MUST include a check that fails if a secret-like value is committed.
- **FR-025**: Local credentials the check needs MUST come from the provider's own sign-in tools or a gitignored local file, with a committed example file listing names only.

### Key Entities

- **Setup item**: One thing that must be in place (for example "main branch protected"). Has a name, purpose, where it is configured, how it is confirmed, the walkthrough step that covers it, and the constitution principle it serves.
- **Check result**: The status of one setup item at one moment: complete, missing, pending or could-not-check, plus the next action when not complete.
- **Secret reference**: The name and location (which secret store) of a secret the setup needs, plus its purpose and required permissions. Never the value.
- **Walkthrough step**: The guided version of a setup item: explanation, where to act, whether it needs Don, and the confirmation it runs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Don can go from no setup to a fully passing setup check by following the walkthrough in a single sitting of under 90 minutes, excluding time waiting for DNS changes to take effect.
- **SC-002**: The setup check completes and prints its report in under 30 seconds on a normal connection.
- **SC-003**: 100% of setup items reported by the check have a documented step and a walkthrough step, and every missing item in the report includes a next action.
- **SC-004**: Zero secret values appear in the repository, chat transcripts, check output, pipeline logs or deployment logs, confirmed by the committed secret scan and by review of a full walkthrough run.
- **SC-005**: Throughout and after setup, the live domain continues to serve the current Ghost site and email keeps working, with no downtime attributable to this feature.
- **SC-006**: A pull request that fails the automated checks cannot be merged, and a pull request marked as major cannot be merged without Don's approval, confirmed by one test pull request of each kind.
- **SC-007**: Running costs added by this slice are $0 a month (free tiers only), well inside the $13 ceiling.

## Assumptions

- **Providers are fixed by the constitution**: GitHub for code (repository `drcdev/dcc-web` already exists), GitHub Actions for the pipeline, Cloudflare for hosting (Workers with static assets through Workers Builds), DNS, previews and Web Analytics. Squarespace, the existing registrar, stays as registrar only. No new provider is introduced.
- **Walkthrough form**: The walkthrough is run by Claude Code in Don's terminal session (the agent reads the documented steps, pauses for Don, then runs the step's confirmation). Chosen because Don already works through Claude Code and the constitution expects agents to do the building. A plain document is the fallback for doing it without an agent (Story 3).
- **Temporary address**: `new.doncoleman.ca`, recorded in the setup document.
- **Marking a change as major**: A pull request is treated as major when it carries a "major" label or touches paths that are major by definition (CI, deployment and infrastructure configuration, dependency manifests, the constitution). The plan chooses the enforcement mechanism, preferring the code host's own features (for example code owners and required reviews) before custom automation.
- **Single-maintainer approval**: GitHub does not count an author's approval of their own pull request, so agents open pull requests as a dedicated GitHub machine account (for example `dcc-bot`, one free machine account per person under GitHub's terms). Don is the required code-owner reviewer for major changes.
- **Current DNS host and Ghost setup**: The domain is registered and DNS-hosted at Squarespace today. Don has admin access to Squarespace and to the current Ghost hosting, and the existing DNS records can be exported or listed from Squarespace.
- **Cloudflare plan**: The free plan covers DNS, Workers static assets, Workers Builds with preview URLs, the temporary address and Web Analytics.
- **Package manager and tooling**: The plan chooses one package manager and the minimal tooling needed for the check, its tests, type checks and linting, consistent with the constitution's TypeScript-strict constraint. Adding these is a major change reviewed on this slice's pull request.
- **This slice is itself a major change** (it adds CI, deployment and infrastructure configuration and dependencies), so its own pull request needs Don's approval after he views the preview.

## Out of Scope and Follow-up Work

- Contact service setup (Fly.io app, volume, secrets, Turnstile keys): done in the contact feature. The check is designed so that feature can add its own items.
- Switching the live domain from Ghost to the new site: done at launch, including removing the temporary address's no-index rule.
- Scaffolding the real Astro site, Tailwind theme and content collections: a later feature; this slice ships only a placeholder page.
- Extending the `verify` gate with build, end-to-end, accessibility and performance-budget checks: added by the features that introduce what they check.
- Automatic secret rotation and expiry reminders for deployment credentials: possible follow-up.
- Running the full provider-side setup check on a schedule (drift detection) in CI: possible follow-up.
