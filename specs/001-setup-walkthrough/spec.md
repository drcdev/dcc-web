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

- Q: How should major-change pull requests get an approval that GitHub will count, given that GitHub does not let an author approve their own pull request? → A: Machine account. Agents open pull requests as a separate GitHub machine user (for example `drc-agents`) with write access, and Don is the required code-owner reviewer.
- Q: Which Cloudflare hosting product and deploy trigger should the site use for production and per-branch previews? → A: Cloudflare Workers with static assets, deployed by Cloudflare's Git integration (Workers Builds). Main deploys to production and every other branch gets a preview URL. No Cloudflare deploy token is stored in GitHub.
- Q: Should this slice move the whole domain's DNS to Cloudflare now, or keep DNS where it is until launch? → A: Move the nameservers to Cloudflare now. The domain is registered and DNS-hosted at Squarespace today. Squarespace stays as registrar only (Cloudflare Registrar does not sell .ca). Every existing record is copied to Cloudflare and checked against the originals before the switch, and Ghost keeps working unchanged.
- Q: What subdomain should the pre-launch review address use? → A: `new.doncoleman.ca`.
- Q: How should visitor statistics be set up in this slice? → A: Cloudflare Web Analytics, turned on now for `new.doncoleman.ca` with automatic (script-free) setup, because the zone will be on Cloudflare. The check confirms it is on, and production counting carries over at launch.
- Q: Should DNS record parity (FR-035) require an exact TTL match against the Squarespace baseline? → A: No. Cloudflare's dashboard offers only TTL presets, not a custom value, so Cloudflare DNS records stay on "Auto". The baseline keeps the Squarespace TTL for the audit trail, and the check reports a TTL difference as an informational detail only — it does not count as a mismatch and does not keep the item `missing`. TTL cannot break the live site or mail, so this doesn't weaken the safety the parity check exists for.

### Session 2026-09-28 (update)

- Q: What is the actual name of the GitHub machine account from FR-013? → A: `drc-agents`. Don created the account under this name instead of the originally planned `dcc-bot`; every reference to the machine account across the repository (config, checks, docs, specs, tests and fixtures) uses `drc-agents`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check setup status at any time (Priority: P1)

Don runs one check from the repository. It looks at every part of the setup covered by this slice and prints a short report: each item is marked complete or missing, and each missing item has a one-line explanation of what to do and a pointer to the matching walkthrough step. The check never shows a secret value; for secrets it only confirms that a value with the expected name exists.

**Why this priority**: The check is the thing Don (and later agents) will use repeatedly, before every feature and before launch. It also defines, in testable form, what "setup complete" means, so the walkthrough in Story 2 can be built around it.

**Independent Test**: With nothing set up, run the check and confirm every item is reported missing (or could-not-check where the credentials needed to check it do not exist yet, per FR-027) with a next action. Complete one item by hand (for example, add a required pipeline secret), run the check again, and confirm only that item flips to complete.

**Acceptance Scenarios**:

1. **Given** a fresh clone and no setup done, **When** Don runs the check, **Then** every setup item is listed as missing (or could-not-check where the credentials needed to check it do not exist yet, per FR-027), each with what to do and which walkthrough step covers it, and the check ends with a non-success result.
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

- **Existing DNS records**: Before the nameservers at Squarespace are changed to Cloudflare's, every existing record at Squarespace (the Ghost site, email records such as MX, SPF, DKIM and DMARC, and any verification records) must be copied to Cloudflare. The walkthrough must have Don compare the imported records against the Squarespace originals, and they must match (as defined in FR-034 to FR-036), before the nameservers change, so the live site and email keep working.
- **Squarespace-only records**: Some records may be managed by Squarespace itself (for example its own defaults or domain-connect entries). The comparison must flag any record that exists at Squarespace but not at Cloudflare, and Don must decide on each one (keep or drop, with a reason for drop) before the switch. An undecided record blocks the switch (FR-037).
- **Nameserver change in progress**: DNS delegation can take hours to take effect. The check reports this as "pending" with an explanation, not as missing. This is one case of the general missing/pending rule in FR-027.
- **Live domain accidentally switched**: If the check finds the live domain no longer pointing at the Ghost site before launch (detected as defined in FR-038), it reports this as a problem, not as complete: the item is `missing`, its summary starts with "Problem:", its next action tells Don to restore the Ghost records from the recorded baseline in Cloudflare straight away, and the walkthrough shows it before any other step.
- **Temporary address exposed to search engines**: The temporary review address must not be indexed; the check reports it as `missing` if a response from it lacks the no-index header (FR-020). The check cannot see a search engine's index, so the remedy is to restore the header; if pages were already indexed, the runbook tells Don how to ask the search engine to remove them (a manual step, not confirmed by the check).
- **Secret names drift**: If the pipeline expects a secret name that is not documented, or the document lists one the pipeline no longer uses, the check or its tests flag the mismatch. Drift between committed files is a failing test in the `verify` gate, so it blocks merging; drift between the documented names and the names actually stored at GitHub makes the pipeline-secrets item `missing`. Neither is only a warning.
- **Sole maintainer approval**: GitHub does not let an author approve their own pull request. Agents therefore open pull requests as a separate machine account, so Don's review counts. If a pull request is opened from Don's own account by mistake, Don's approval will not count, and the pull request must be reopened from the machine account. Responsibility is fixed: the major-change approval check on the pull request fails with that explanation when a major-labelled pull request is authored by Don; for path-based major changes GitHub's own code-owner rule blocks the merge, and the machine-account walkthrough step and runbook section explain the rule before it can happen. The setup check does not inspect individual pull requests.
- **Partially configured branch protection**: If protection exists but does not require the automated checks, or allows bypass, the check reports exactly which rule is missing, by name, from this closed list: protection active on `main`; pull request required; code-owner review required; stale approvals dismissed on new commits; required check `verify`; required check `major-change-approval`; branch must be up to date before merging; force-pushes blocked; deletion blocked; no bypass actors.
- **Check run in CI versus locally**: Provider-side items that need Don's credentials may not be checkable in CI; the check must say which items it skipped and why, and must not fail CI because of them unless CI is meant to verify them. In this slice CI runs only the check's automated tests, not the live check (scheduled live checking is follow-up work). Any item whose confirmation needs a provider credential or network access (see the "Checked against" column in the setup item table) is in the skippable category; if the live check is later run where those are unavailable, such items are reported `could-not-check` with the reason "skipped: no credentials".

## Requirements *(mandatory)*

### Functional Requirements

**Setup check**

- **FR-001**: The repository MUST provide a single command that checks every setup item in this slice and reports each as complete, missing, pending or could-not-check.
- **FR-002**: For each item that is not complete, the check MUST say what to do next and name the matching walkthrough and documentation step. The minimum content of a next action is defined in FR-028.
- **FR-003**: The check MUST end with a success result only when every item is complete, and a non-success result otherwise, so it can be used as a gate.
- **FR-004**: The check MUST be read-only: it never changes any setting in the repository host, hosting provider, DNS or pipeline. This MUST be verified by automated tests that fail if any provider access code can issue a request that changes state (any non-read method or write option), not only by stating intent. Read-only behaviour is guaranteed by the check's own code and does not depend on the scope of the credential it uses: where a provider exposes a credential's access level (the machine account's repository permission), the check reports excess access as `missing`; where it does not (the Cloudflare token's permission list is not readable with a read-only token), the walkthrough and runbook instruct Don to create a read-only token and the check does not claim to verify its scope.
- **FR-005**: The check MUST confirm secrets by name only and MUST NOT read, print, log or store any secret value. No partial, masked, truncated or hashed form of a value (for example the last four characters or a length) may appear anywhere: in the check's output, the walkthrough, the documentation or logs. Only names, locations and presence are shown.
- **FR-006**: The check's logic MUST be covered by automated tests that run without real provider accounts (using recorded or simulated provider responses), written and seen to fail before the check is implemented.

**Guided walkthrough**

- **FR-007**: The repository MUST provide a guided walkthrough covering every setup item, in an order that avoids breaking the live site (DNS records copied and compared before nameservers change).
- **FR-008**: Each walkthrough step MUST state what it is for, where to do it, and how it will be confirmed, as three separately labelled parts ("What it is for", "Where to do it", "How it will be confirmed") in that order, each starting on its own line, so a screen-reader or terminal-reader user can find each part rather than reading one undifferentiated block.
- **FR-009**: The walkthrough MUST pause at every step that needs Don and continue only after Don confirms and the step's confirmation passes, or after Don explicitly chooses to skip the step for now (the step stays incomplete and steps that depend on it are shown as blocked). If the confirmation reports `pending`, the walkthrough explains the wait and moves on only to steps that do not depend on the pending one. Pausing means the walkthrough halts: it runs no further confirmations, shows no later step's instructions and prepares nothing for later steps until Don answers. It offers three answers at every pause: done (run the confirmation), skip for now, and stop. If the confirmation fails, it shows the new finding and next action and pauses again on the same step, with no limit on retries; Don can skip or stop at any time.
- **FR-010**: The walkthrough MUST use the same confirmation logic as the setup check, so the two cannot disagree. "Same" means shared implementation, not equivalent behaviour: the walkthrough confirms a step only by running the setup check for that item and using its result, and contains no confirmation logic of its own. An automated test in the `verify` gate MUST fail if the walkthrough's definition does not confirm steps through the check command.
- **FR-011**: The walkthrough MUST be resumable: re-running it skips completed steps and starts at the first incomplete one. "First incomplete" means the lowest-numbered step in the fixed step order (see the setup item table) that is not `complete` and whose prerequisite steps are all `complete`. Completed steps are skipped wherever they fall in the order, so steps done out of order are recognised. Resumption is computed from a fresh check run each time, not from stored progress.
- **FR-012**: The walkthrough MUST NOT ask Don to type, paste or reveal a secret value in the chat; it directs him to enter secrets directly into the provider's secret store or a gitignored local file. Because the walkthrough is run by an agent whose transcript records every command and its output, the guarantee rests on three rules, each written into the walkthrough's instructions: (a) it never asks for a value; (b) it never runs a command whose output can contain a secret value (for example printing the local credentials file or the environment, or printing a sign-in token), and runs only the read-only commands its instructions allow; (c) if Don pastes something that looks like a secret into the chat, it does not repeat it and tells him to revoke and replace it. Compliance is confirmed by the transcript review in SC-004.

**Setup items covered**

- **FR-013**: *Code repository*: the main branch MUST be protected so that changes merge only through pull requests, only when the required automated checks pass, and without force-pushes, deletion or admin bypass. Agents MUST open pull requests as a dedicated GitHub machine account (for example `drc-agents`) with write access, separate from Don's account. The machine account's repository permission MUST be write (or maintain) and MUST NOT be admin. The check MUST confirm that the machine account has access and reports the item `missing` if its permission is below write or is admin.
- **FR-014**: *Major-change approval*: a pull request identified as a major change (as defined by constitution Principle III) MUST NOT be mergeable without Don's explicit approval, given as a required code-owner review from Don's account; other pull requests may merge once checks pass. The check MUST confirm both marking mechanisms named in the Assumptions exist: that the code-owner rules name Don for every path that is major by definition, and that the major-change label and the required approval check for labelled pull requests exist. The status of setup items and the major-change rules are otherwise independent: an incomplete setup item does not change how a pull request is classified, and this slice's own pull request is major for the reasons given in the Assumptions.
- **FR-015**: *Automated check pipeline*: the repository MUST have a pipeline that runs on every pull request and on main, runs the same `verify` gate that runs locally, and reports a named check that branch protection requires.
- **FR-016**: *Local verify gate*: the repository MUST have a single local `verify` command that mirrors what the pipeline runs. For this slice it covers at least the secret scan (FR-024), the setup check's tests, type checks, linting, the build and the placeholder's accessibility scan (FR-033); later features extend it (end-to-end journeys for real pages, site-wide accessibility and the full performance budget) without replacing it.
- **FR-017**: *Hosting*: a Cloudflare account and a Worker with static assets MUST exist, connected to the repository through Workers Builds. Workers Builds MUST deploy main to production and upload every other branch as a version with its own preview URL. Because main is protected (FR-013), production only ever deploys code that has passed the required checks.
- **FR-018**: *Deployable placeholder*: so that previews can be confirmed, the slice MUST deploy a minimal placeholder page; the real site is built by later features. The placeholder MUST meet WCAG 2.2 AA in its own right, with the specific requirements in FR-031 to FR-033.
- **FR-019**: *DNS*: in this slice, the domain's nameservers MUST move from Squarespace to Cloudflare, with Squarespace kept as registrar only. Every existing record MUST be copied to Cloudflare and checked against the Squarespace originals before the nameserver switch, so the live domain still serves the current Ghost site, unchanged, and email still works. What "every record", "checked against" and "still serves Ghost" mean is defined in FR-034 to FR-039.
- **FR-020**: *Temporary address*: the review address `new.doncoleman.ca` MUST serve the new site's production deployment over HTTPS as a custom domain on the Worker, and MUST ask search engines not to index it. The no-index mechanism is the HTTP response header `X-Robots-Tag: noindex` on every response from every path of the deployment (not only the home page), backed up by a `<meta name="robots" content="noindex">` tag on each HTML page. Crawling MUST NOT be blocked with `robots.txt`, because a crawl block would hide the no-index rule. The check confirms the header by fetching `https://new.doncoleman.ca/` and requiring an `X-Robots-Tag` header whose value contains `noindex`; an automated test confirms that the header rule applies to all paths. The review address serves the same built page as the placeholder, so it is held to the same accessibility requirements (FR-031 to FR-033); the only differences at that address are response headers and the edge-injected analytics beacon, which adds no visible content.
- **FR-021**: *Pipeline variables and secrets*: every variable and secret the pipeline needs for this slice MUST be defined by name in the pipeline's secret store, documented by name and purpose, and confirmed by the check without exposing values. Deployment credentials MUST be scoped to the minimum permissions needed. Deployment runs in Workers Builds, so no Cloudflare deploy token is stored in GitHub. The machine account's credential lives only in the agent's local sign-in or a gitignored file, never in the repository. Each credential has exactly one home and a stated maximum scope:

  | Credential | Lives in (only) | Maximum scope |
  |---|---|---|
  | Cloudflare API token used by the check | Gitignored local credentials file on Don's machine | Read only, limited to Don's Cloudflare account and the `doncoleman.ca` zone: zone read, DNS read, Workers scripts read, Web Analytics read |
  | Cloudflare account and zone identifiers | Same gitignored file (not secret, reported by name only) | n/a |
  | Don's GitHub sign-in used by the check | GitHub CLI's own sign-in store on Don's machine | Don's own account; the check uses it for reads only (FR-004) |
  | Machine account credential | The agent's GitHub CLI sign-in store (or a gitignored file) | Repository permission write or maintain, never admin (FR-013) |
  | Workers Builds deployment access | Cloudflare's GitHub integration, authorised in the Cloudflare and GitHub dashboards | Access to the `drcdev/dcc-web` repository only |
  | GitHub Actions secrets and variables | GitHub Actions secret store | None needed in this slice; the workflows use only the automatic per-run token with read permissions |
- **FR-022**: *Visitor statistics*: Cloudflare Web Analytics MUST be turned on for `new.doncoleman.ca` using automatic setup (no script added to the page, no cookies, no personal data), and the check MUST confirm it is on. Production counting carries over to the live domain at launch.

**Documentation and secrets**

- **FR-023**: The setup MUST be documented in the repository in plain language, one section per setup item, with purpose, location, confirmation, the constitution principle it serves, and the names (never values) of any secrets involved. One-to-one coverage between the check's items, the walkthrough's steps and the documentation sections (keyed by item ID, FR-026) MUST be enforced by an automated test in the `verify` gate, so a missing or extra section fails the gate rather than relying on manual review.
- **FR-024**: No secret value MAY be committed to the repository, shown in the chat, or printed in any log (local, pipeline or deployment). The verify gate MUST include a check that fails if a secret-like value is committed. A "secret-like value" is any string matched by the secret scanner's recommended rule set (credential and private-key patterns for common providers) or by GitHub's push-protection patterns, over every tracked file. False positives are handled only by a path-specific ignore entry that names the file and is reviewed in the pull request; rules are never switched off globally, and gitignored local credential files are the only files the local scan excludes besides build output, dependencies and the lockfile. "Never printed in logs" includes provider tools' own output: the check and the walkthrough MUST NOT turn on verbose or debug modes of provider tools or SDKs (which can echo request headers carrying tokens), and any error text from a provider tool passes through the same redaction as the check's own output before it is shown.
- **FR-025**: Local credentials the check needs MUST come from the provider's own sign-in tools or a gitignored local file, with a committed example file listing names only. In the example file every name has an empty value (`NAME=`); it contains no placeholder that looks like a real secret, and any explanation is a comment naming the purpose and required scope. The example file is scanned like any other tracked file and must pass.

**Status definitions and report content**

- **FR-026**: Every setup item MUST have a stable kebab-case ID and a fixed step number, as listed in the setup item table below. The check's report ("Step N of 18"), the walkthrough and the documentation section for an item all use the same ID and step number, and the documentation section's link anchor is the ID.
- **FR-027**: The four statuses MUST be assigned by these rules, which apply to every item:
  - `complete`: the item's completion condition (setup item table) holds right now.
  - `pending`: Don's action has been made and is visible at the provider, but the provider is still applying it (for example DNS delegation propagating, or a build queued or running), and the item will become `complete` without further action from Don. Only items whose provider has such an in-progress stage can be `pending`; in this slice those are `dns-nameservers` and `workers-builds`.
  - `missing`: the completion condition does not hold and no provider-side change is in progress, so someone must act. This includes regressions and problems (such as the live domain no longer pointing at Ghost), and prerequisites not yet done (the next action then names the prerequisite step).
  - `could-not-check`: the check could not get the information it needs (a provider or resolver is unreachable, a call timed out, a credential is absent, expired or lacks read access, or the item was deliberately skipped). It is never used when the information was obtained.
- **FR-028**: A next action MUST be one or more plain-language sentences that start with what to do (an imperative verb), name where to do it (the screen path, the command, or the file), and are followed by the step number and documentation link. It MAY include item-specific details from the failure (for example which branch-protection rules or which DNS records are missing), filling a per-item template rather than being fixed text. For `pending` it states what is being waited on, the expected wait, and that no action is needed now. For `could-not-check` a separate reason line states the access problem, and the next action says how to restore access.
- **FR-029**: Reports MUST NOT depend on colour or symbols alone. Each status is shown as its own word or words ("complete", "missing", "pending", "could not check"), paired with any symbol; a `could-not-check` item always has a line starting "Reason:" so it cannot be mistaken for `missing`; colour is turned off when output is not a terminal or when `NO_COLOR` is set; every line is plain text readable in order by a screen reader or terminal reader, with no information carried only by column alignment or box-drawing characters; and a machine-readable form of the same report is available.
- **FR-030**: When a message would otherwise contain a secret value (for example provider error text), the value MUST be replaced with the word `[redacted]` and the message MUST still name the secret by name and say what is wrong, so the explanation stays clear to every reader while the value stays hidden.

**Accessibility**

- **FR-031**: The placeholder page MUST meet WCAG 2.2 Level AA. It MUST have: `lang="en"` on the root element; a descriptive `<title>`; exactly one `main` landmark; exactly one level-1 heading and no skipped heading levels; text and link colours with a contrast ratio of at least 4.5:1 against the background (browser default colours meet this, and any colour set later must still meet it); content that reflows without loss or two-direction scrolling at 320 CSS pixels wide and at 200% zoom; and no non-text content (images, icons or media). If non-text content is added later, it needs a text alternative, or empty alternative text if decorative.
- **FR-032**: The placeholder page MUST be fully usable with a keyboard alone and with JavaScript turned off (Principle V). Its only interactive element, the link to the current site, MUST be reachable by keyboard in reading order, have an accessible name that says where it goes, and show a visible focus indicator.
- **FR-033**: The `verify` gate MUST run an automated accessibility scan of the placeholder page using the WCAG 2.0, 2.1 and 2.2 Level A and AA rule sets. Any violation fails the gate, and because the gate is a required check (FR-015), it blocks the merge. Placeholder, report and walkthrough copy follows the constitution's plain-language rule, made checkable as: sentences state one thing; each report summary is one sentence; technical terms (for example "nameserver" or "ruleset") are explained in the matching documentation section; no marketing language.

**DNS migration safety**

- **FR-034**: The baseline of original records MUST list every record shown on Squarespace's DNS screen for the domain and its subdomains, of any type (A, AAAA, CNAME, MX, TXT, SRV, CAA, and NS for any delegated subdomain), each with type, name, content, TTL and priority (MX and SRV), plus a keep or drop decision. The domain's own apex NS records are not copied (Cloudflare supplies them) but the original nameservers MUST be recorded in the documentation before the switch, for rollback (FR-039). The baseline is reviewed by Don and committed, so the comparison is repeatable and auditable.
- **FR-035**: A baseline record marked keep "matches" only if the Cloudflare zone has a record with equal type, name, content and (for MX and SRV) priority, and with Cloudflare's proxy turned off (DNS only). Every Ghost and email record is kept DNS only. Equality is exact after only these normalisations: names are compared case-insensitively and without a trailing dot; hostname content is compared case-insensitively and without a trailing dot; TXT content is compared after joining its quoted parts and removing the surrounding quotes. TTL is not part of the match: Cloudflare's dashboard offers only TTL presets, not a custom value, so Cloudflare records stay on "Auto"; the baseline still records the original Squarespace TTL for the audit trail, and the check reports a TTL difference as an informational detail only, never a mismatch. Anything else, including a difference in whitespace or case inside TXT content, is a mismatch.
- **FR-036**: Email records get no looser treatment: MX target and priority, and the exact SPF, DKIM and DMARC TXT strings, must match under FR-035. Each mismatch is reported record by record, showing the baseline value and the Cloudflare value (DNS records are public, not secrets).
- **FR-037**: The DNS parity item is `complete` only when every keep record matches and no record lacks a decision. The walkthrough MUST refuse to show the nameserver-change step as actionable, and the nameserver item stays `missing` with "complete DNS parity first", while the parity item is not `complete`. To reduce the chance of a record being missed from the baseline (Squarespace has no export), a read-only helper resolves the baseline names and a fixed list of common names (apex, `www`, `mail`, `_dmarc`, common DKIM selectors) in public DNS and shows Don any answer not in the baseline so he can add it with a decision; records imported by Cloudflare's own scan that are not in the baseline are shown in the parity item's details for Don to add or delete.
- **FR-038**: "The live domain still points at Ghost" is decided by one signal: the A, AAAA and CNAME answers for `doncoleman.ca` and `www.doncoleman.ca` from public resolvers equal the Ghost target records for those names recorded in the baseline before the move (only names present in the baseline are compared). Any difference, including answers that point at Cloudflare's proxy or the new Worker, makes the item `missing` with a "Problem:" summary (Edge Cases). Other observations, such as the page's Ghost generator marker, may appear in the details but do not decide the status. The same item also requires every kept MX and email TXT record to resolve in public DNS exactly as in the baseline.
- **FR-039**: The documentation MUST include a rollback procedure for the nameserver switch: if, after the switch, the live site or email stops working and the cause cannot be fixed within Cloudflare in minutes, Don changes the nameservers at Squarespace back to the original ones recorded under FR-034. The walkthrough shows this procedure before Don makes the switch.

### Setup items and completion conditions

The check covers exactly these 18 items, in walkthrough order. "Checked against" names the sources the check needs; if any listed source cannot be reached or read, the item is `could-not-check` (FR-027). Items marked "after merge" need this slice's files on `main`.

| Step | ID | Complete when | Checked against | Can be pending |
|---|---|---|---|---|
| 1 | `local-tools` | Node 24 or later and the pinned package manager version are installed, and the GitHub CLI is signed in as Don | Local machine, GitHub | No |
| 2 | `local-credentials` | The gitignored credentials file has every required name with a non-empty value, and Cloudflare reports the token as active | Local machine, Cloudflare | No |
| 3 | `cloudflare-zone` | Zone `doncoleman.ca` exists on the Free plan and its ID equals the configured zone ID | Cloudflare | No |
| 4 | `dns-records-parity` | Every keep record in the baseline matches the Cloudflare zone (FR-035, FR-036) and no record lacks a decision (FR-037) | Repository, Cloudflare | No |
| 5 | `dns-nameservers` | Public NS answers for `doncoleman.ca` equal the zone's assigned Cloudflare nameservers and Cloudflare reports the zone active; requires step 4 | Public DNS, Cloudflare | Yes, while delegation propagates |
| 6 | `live-domain-ghost` | Apex and `www` still resolve to the recorded Ghost targets and email records resolve as in the baseline (FR-038) | Repository, public DNS | No |
| 7 | `cloudflare-worker` | Worker `dcc-web` exists with its `workers.dev` address and preview URLs turned on | Cloudflare | No |
| 8 | `github-machine-account` | The machine account is a collaborator with write or maintain permission, not admin | GitHub | No |
| 9 | `github-secret-scanning` | GitHub secret scanning and push protection are both on for the repository | GitHub | No |
| 10 | `workers-builds` (after merge) | The latest commit on `main` has a successful Workers Builds run, and the latest open pull request (if any) has one with a preview URL | GitHub | Yes, while a build is queued or running |
| 11 | `github-ci-workflow` (after merge) | Both workflow files exist on `main` and the latest `verify` run on `main` succeeded | GitHub | No |
| 12 | `github-codeowners` (after merge) | The code-owner file on `main` names Don for every major path and GitHub reports no errors in it | GitHub | No |
| 13 | `github-major-label` (after merge) | The `major-change` label exists and the repository allows auto-merge | GitHub | No |
| 14 | `github-main-protection` (after merge) | The active protection on `main` includes every rule in the closed list (Edge Cases), each missing rule named | GitHub | No |
| 15 | `pipeline-secrets` (after merge) | The GitHub Actions secret and variable names equal the documented list (none in this slice), with none missing and none extra | GitHub | No |
| 16 | `review-address` (after merge) | `new.doncoleman.ca` is a custom domain on the Worker and returns 200 over HTTPS | Cloudflare, HTTPS | No |
| 17 | `review-address-noindex` (after merge) | The response from `https://new.doncoleman.ca/` has an `X-Robots-Tag` header containing `noindex` | HTTPS | No |
| 18 | `web-analytics` (after merge) | A Web Analytics site for `new.doncoleman.ca` exists with automatic setup on, and the served page references the Cloudflare beacon | Cloudflare, HTTPS | No |

A step's prerequisites are the earlier steps it needs (for example step 5 needs step 4; steps 16 to 18 need steps 5 and 10). When the walkthrough reaches a step whose prerequisite is not `complete`, it shows the step as blocked, names the prerequisite step, and does not ask Don to act on it or run its confirmation; the check reports such an item `missing` with a next action naming the prerequisite. The walkthrough's opening list shows only each step's number, title and current status; the what/where/how detail (FR-008) is shown only for the step being worked on.

### Key Entities

- **Setup item**: One thing that must be in place (for example "main branch protected"). Has a stable ID, a step number, a name, purpose, where it is configured, how it is confirmed, the walkthrough step that covers it, and the constitution principle it serves.
- **Check result**: The status of one setup item at one moment: complete, missing, pending or could-not-check, plus the next action when not complete.
- **Secret reference**: The name and location (which secret store) of a secret the setup needs, plus its purpose and required permissions. Never the value.
- **Walkthrough step**: The guided version of a setup item: explanation, where to act, whether it needs Don, and the confirmation it runs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Don can go from no setup to a fully passing setup check by following the walkthrough in a single sitting of under 90 minutes, excluding time waiting for DNS changes to take effect. Measured as elapsed time from starting the walkthrough to the first fully passing check, minus the time during which every remaining incomplete item was `pending` (waiting on DNS delegation or a build) and minus the time waiting for this slice's pull request to be reviewed and merged.
- **SC-002**: The setup check completes and prints its report in under 30 seconds on a normal connection. Measured on a full run of all 18 items, with dependencies already installed, on a home broadband connection, with every provider reachable; it holds for a cold first run of the day as well as repeat runs. When a provider is slow, per-call time limits keep the run under 30 seconds and the affected items are `could-not-check`.
- **SC-003**: 100% of setup items reported by the check have a documented step and a walkthrough step, and every missing item in the report includes a next action.
- **SC-004**: Zero secret values appear in the repository, chat transcripts, check output, pipeline logs or deployment logs, confirmed by the committed secret scan and by review of a full walkthrough run.
- **SC-005**: Throughout and after setup, the live domain continues to serve the current Ghost site and email keeps working, with no downtime attributable to this feature.
- **SC-006**: A pull request that fails the automated checks cannot be merged, and a pull request marked as major cannot be merged without Don's approval, confirmed by one test pull request of each kind.
- **SC-007**: Running costs added by this slice are $0 a month (free tiers only), well inside the $13 ceiling.
- **SC-008**: The automated accessibility scan (WCAG 2.0, 2.1 and 2.2 Level A and AA rule sets) reports zero violations on the placeholder page in the `verify` gate, and a manual keyboard-only pass over the page on the review address finds the link reachable with a visible focus indicator.

## Assumptions

- **Providers are fixed by the constitution**: GitHub for code (repository `drcdev/dcc-web` already exists), GitHub Actions for the pipeline, Cloudflare for hosting (Workers with static assets through Workers Builds), DNS, previews and Web Analytics. Squarespace, the existing registrar, stays as registrar only. No new provider is introduced.
- **Walkthrough form**: The walkthrough is run by Claude Code in Don's terminal session (the agent reads the documented steps, pauses for Don, then runs the step's confirmation). Chosen because Don already works through Claude Code and the constitution expects agents to do the building. A plain document is the fallback for doing it without an agent (Story 3).
- **Temporary address**: `new.doncoleman.ca`, recorded in the setup document.
- **Marking a change as major**: A pull request is treated as major when it carries a "major" label or touches paths that are major by definition (CI, deployment and infrastructure configuration, dependency manifests, the constitution). The plan chooses the enforcement mechanism, preferring the code host's own features (for example code owners and required reviews) before custom automation.
- **Single-maintainer approval**: GitHub does not count an author's approval of their own pull request, so agents open pull requests as a dedicated GitHub machine account (for example `drc-agents`, one free machine account per person under GitHub's terms). Don is the required code-owner reviewer for major changes.
- **Current DNS host and Ghost setup**: The domain is registered and DNS-hosted at Squarespace today. Don has admin access to Squarespace and to the current Ghost hosting, and the existing DNS records can be listed from Squarespace's DNS screen (there is no export, see FR-037).
- **Cloudflare plan**: The free plan covers DNS, Workers static assets, Workers Builds with preview URLs, the temporary address and Web Analytics.
- **Package manager and tooling**: The plan chooses one package manager and the minimal tooling needed for the check, its tests, type checks and linting, consistent with the constitution's TypeScript-strict constraint. Adding these is a major change reviewed on this slice's pull request.
- **Checklist-driven definitions**: The status rules (FR-027), next-action content (FR-028), accessibility bar (FR-031 to FR-033) and DNS matching and live-domain detection rules (FR-034 to FR-039) were settled while resolving the requirement checklists, consistent with the clarifications above and the plan. TTL is informational only (FR-035): Cloudflare's dashboard offers TTL presets, not a custom value, so copied records stay on Cloudflare's automatic TTL while the baseline still records the Squarespace value for the audit trail.
- **This slice is itself a major change** (it adds CI, deployment and infrastructure configuration and dependencies), so its own pull request needs Don's approval after he views the preview.

## Out of Scope and Follow-up Work

- Contact service setup (Fly.io app, volume, secrets, Turnstile keys): done in the contact feature. The check is designed so that feature can add its own items.
- Switching the live domain from Ghost to the new site: done at launch, including removing the temporary address's no-index rule.
- Scaffolding the real Astro site, Tailwind theme and content collections: a later feature; this slice ships only a placeholder page.
- Extending the `verify` gate beyond this slice's checks (end-to-end journeys for real pages, site-wide accessibility scans and the full performance budget): added by the features that introduce what they check.
- Automatic secret rotation and expiry reminders for deployment credentials: possible follow-up.
- Running the full provider-side setup check on a schedule (drift detection) in CI: possible follow-up.
