# Privacy & Security Checklist: Setup Walkthrough and Setup Check

**Purpose**: Validate that requirements for secret handling, read-only provider access, credential scoping, DNS migration safety and review-address noindex are complete, unambiguous and testable, per Constitution Principles VII and IX and spec Edge Cases.
**Created**: 2026-09-28
**Feature**: [spec.md](../spec.md)

**Note**: This checklist tests the requirements as written — it does not test running code, tokens or DNS state. Evaluated 2026-09-28; gaps were closed in spec.md (see FR-026 to FR-039, the setup item table and SC-008).

## Secret Handling

- [x] CHK001 - Is "never shown in chat" (FR-012) defined precisely enough to be testable, given the walkthrough is run by an agent in Don's terminal session — does the spec state the mechanism that guarantees no secret value ever appears in an agent transcript? [Ambiguity, Spec §FR-012, Assumptions "Walkthrough form"]
- [x] CHK002 - Is "secret-like value" defined with objective criteria for the verify gate's commit scan (FR-024), or left entirely to the scanning tool's default judgement with no stated acceptance/false-positive handling? [Clarity, Spec §FR-024]
- [x] CHK003 - Are FR-005 ("confirm secrets by name only") and FR-021 ("documented by name and purpose") consistent on whether partial/masked values (e.g., last four characters) are permitted anywhere, or does the spec leave that ambiguous? [Consistency, Spec §FR-005, FR-021]
- [x] CHK004 - Does the spec require that "never printed in logs" cover third-party provider SDK/CLI debug or verbose output that might echo request headers containing tokens? [Gap, Spec §FR-024]
- [x] CHK005 - Is the committed example file's requirement (FR-025, "names only") explicit about format (e.g., empty values, no placeholder that resembles a real secret), so it cannot itself trip the secret scan or mislead? [Clarity, Spec §FR-025]

## Read-Only Provider Access

- [x] CHK006 - Is "never changes any setting" (FR-004) stated as a measurable/verifiable requirement — does the spec define how read-only behavior will be confirmed, or is it only a stated intent with no acceptance test? [Measurability, Spec §FR-004]
- [x] CHK007 - Does the spec define what the check must do if a credential turns out to have write access (i.e., is over-scoped) — reported as missing/could-not-check, or left unaddressed? [Gap, Spec §FR-004, FR-021]

## Token / Credential Scoping

- [x] CHK008 - Are minimum required permission scopes for each provider credential (Cloudflare read token, GitHub machine account) enumerated at the requirement level (FR-021), or only in supporting design artifacts without a spec-level acceptance bar? [Gap, Spec §FR-021]
- [x] CHK009 - Is the machine account's maximum access level ("write access", FR-013) bounded clearly enough to exclude admin, and is that upper bound testable by the check? [Clarity, Spec §FR-013]
- [x] CHK010 - Does the spec state where each class of credential (deployment, machine-account, local read-only token) MUST live, with no overlap or ambiguity about which secret store owns which credential? [Consistency, Spec §FR-021, FR-025]

## DNS Migration Safety

- [x] CHK011 - Are the DNS record types that must be compared before the nameserver switch exhaustively listed in the requirements, or only given as illustrative examples ("for example MX, SPF, DKIM and DMARC")? [Ambiguity, Spec §Edge Cases "Existing DNS records"]
- [x] CHK012 - Is "match" for the pre-switch record comparison defined precisely (exact value equality vs. semantic equivalence — TTL differences, trailing dots, proxied flag) anywhere in the requirements? [Clarity, Spec §FR-019]
- [x] CHK013 - Does the spec require the nameserver switch to be blocked when a Squarespace-only record has no recorded decision, or is that left to walkthrough judgement at the time? [Gap, Spec §Edge Cases "Squarespace-only records"]
- [x] CHK014 - Is there a requirement defining what "match" means specifically for email records (MX priority, exact SPF/DKIM/DMARC string equality), given their sensitivity to exact formatting? [Gap, Coverage]
- [x] CHK015 - Are rollback or recovery requirements defined for the case where the nameserver switch breaks the live domain or email, beyond SC-005's outcome statement ("no downtime attributable to this feature")? [Gap, Exception Flow, Spec §SC-005]
- [x] CHK016 - Is the "live domain accidentally switched" edge case paired with an unambiguous, single detection signal the check can use (e.g., one specific response feature that distinguishes Ghost from the new site), or could multiple interpretations of "pointing at the new site" apply? [Clarity, Spec §Edge Cases]
- [x] CHK017 - Does the spec state a required severity/response when the check detects the live domain pointing at the new site pre-launch, beyond "reports this as a problem, not as complete"? [Ambiguity, Spec §Edge Cases]

## Review Address Noindex

- [x] CHK018 - Is the noindex requirement for `new.doncoleman.ca` (FR-020) specific about mechanism (HTTP response header vs. meta robots tag vs. robots.txt)? [Clarity, Spec §FR-020]
- [x] CHK019 - Does the requirement cover all paths on the review address, or only the root response, leaving other routes' indexability unspecified? [Gap, Spec §FR-020]
- [x] CHK020 - Is the check's method for verifying noindex specific enough to be objectively testable (e.g., a named header and value), given "asks search engines not to index it" is otherwise generic? [Measurability, Spec §FR-020]
- [x] CHK021 - Does the spec define remediation requirements if the review address is found already indexed (Edge Cases "Temporary address exposed to search engines"), or only detection? [Gap, Spec §Edge Cases]

## Dependencies & Assumptions

- [x] CHK022 - Is the assumption that "the existing DNS records can be exported or listed from Squarespace" validated against any fallback requirement if Squarespace's export is incomplete or a record is missed? [Assumption, Spec §Assumptions "Current DNS host and Ghost setup"]

## Notes

- Generated non-interactively (auto mode); no user interview was conducted. Scope was inferred from the caller's brief: secret handling, read-only access, credential scoping, DNS migration safety, and review-address noindex.
- Depth: standard, weighted toward the DNS migration area given it is the only step in this slice with a live-site downtime risk (SC-005).
- Audience/timing: spec/plan authors and reviewer, before `/speckit-tasks`.
- Open risk: several DNS-comparison and live-domain-detection requirements (CHK011, CHK012, CHK016, CHK017) currently rely on prose ("must match", "reports this as a problem") without an objective equality/detection definition — worth resolving via `/speckit-clarify` or in plan.md before tasks are written, since a wrong live-domain detection could take down email or the current Ghost site.
