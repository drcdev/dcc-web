# Security Checklist: Docs-only verify gate

**Purpose**: Validate supply chain, CI token, input-handling and secret-scan requirements for the changed CI gate.
**Created**: 2026-10-09
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md)

## Secret scan

- [x] CHK001 Is it required that the secret scan runs on every tier, over the whole repository rather than the changed files? [Completeness, Spec §FR-005, §FR-003]
- [x] CHK002 Is the scan's condition required to be unconditional so a sorting error cannot skip it? [Clarity, Plan Tests §3]
- [x] CHK003 Is a failing secret scan required to fail `verify` on the docs and skip-safe tiers, with no skip-accepting rule that covers it? [Consistency, Spec §FR-008]
- [x] CHK004 Are documentation files (which can hold example tokens or setup values) stated to be in scan scope? [Coverage, Spec §FR-005]

## Untrusted input and injection

- [x] CHK005 Are the inputs to the sorter that an outside party can influence (file paths, branch names, `github.event.before`) identified as untrusted? [Gap, Plan Constitution VII]
- [x] CHK006 Is the requirement that `github.event.before` reaches the script through an environment variable, never interpolated into a shell line, stated as a requirement and not only a design note? [Clarity, Plan Constitution VII]
- [x] CHK007 Is validation of `before` (length, hex characters) specified before it is used in a git command? [Completeness, Plan Tests §1]
- [x] CHK008 Are path-traversal and encoding tricks (`..`, leading `/`, backslash, case variants, unicode lookalikes) covered by the documentation-file definition? [Coverage, Spec §FR-001, §FR-002]
- [x] CHK009 Is a changed file whose name could be read as a git option or contain newlines addressed in how the file list is collected? [Gap, Edge Case]

## Token, permissions and supply chain

- [x] CHK010 Is it required that no job gains write permissions or new secrets, and that the existing permission check stays in force? [Completeness, Plan Security Baseline]
- [x] CHK011 Are the fetch step's credentials and scope (read-only checkout token, no new token) specified? [Gap, Spec §FR-009]
- [x] CHK012 Is the behaviour for pull requests from forks, where the token is read-only and secrets are absent, defined for the tier sorting? [Coverage, Gap]
- [x] CHK013 Is the "no new dependency, action or service" constraint stated as a requirement, with the existing pinned `actions/checkout` the only action used? [Clarity, Plan Technical Context]
- [x] CHK014 Is it stated that a change to the workflow or the tier scripts is never docs-tier, so a PR cannot weaken the gate while classified as documentation? [Coverage, Spec Edge Cases]
- [x] CHK015 Is the review requirement for this major change (Don's approval, CODEOWNERS, PR body flag) stated, and does the ruleset still require only `verify`? [Consistency, Spec Context, Constitution III]
- [x] CHK016 Is the independence of Cloudflare Workers Builds deploys from this workflow stated as an assumption with its source? [Assumption, Spec Context]
- [x] CHK017 Is a bypass scenario defined: a PR of only `.md` files under `docs/` that alters executable behaviour (for example a doc that a unit check turns into a command)? [Gap, Spec §FR-006]
