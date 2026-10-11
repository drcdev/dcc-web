# Content Integrity and Build Validation Checklist: Home page with a Now section and Start here reading paths

**Purpose**: Validate that the requirements for the Now entry, reading paths and their build failures are complete, unambiguous and consistent across spec, data model and contracts
**Created**: 2026-10-11
**Feature**: [spec.md](../spec.md), [data-model.md](../data-model.md), [contracts/build-errors.md](../contracts/build-errors.md), [contracts/content-files.md](../contracts/content-files.md)

**Note**: These items test the quality of the written requirements, not the implementation.

## Now Entry Validation

- [ ] CHK001 Is "missing" defined for each required Now part (absent key, empty string, whitespace only, body without a contact link)? [Clarity, Spec §FR-006]
- [ ] CHK002 Are the limits on Now topic length (data model: one line, at most 200 characters) stated in the spec, or only in the data model? [Consistency, Spec §FR-003, Data Model]
- [ ] CHK003 Is "date in the future" defined against a stated reference (build date, time zone), and is the boundary day (today) specified? [Ambiguity, Spec §Edge Cases]
- [ ] CHK004 Is an invalid calendar date (for example 2026-02-30) or a wrong date format addressed as a build failure? [Gap, Spec §FR-006]
- [ ] CHK005 Is the "exactly one Now entry" rule in the spec (Key Entities) matched by a stated failure for zero or two entries? [Consistency, Spec §Key Entities, Data Model]
- [ ] CHK006 Is the requirement that an unknown or misspelled field fails the build stated as a requirement, not only a data-model note? [Gap, Data Model]
- [ ] CHK007 Is the check that the "open to" line links to the contact page defined precisely (which address forms count, and what if there are two links)? [Clarity, Spec §FR-004]
- [ ] CHK008 Is the date display format consistent between the spec example ("1 October 2026") and the data model and contract ("October 1, 2026")? [Conflict, Spec §US1-AS1, Data Model]
- [ ] CHK009 Is the launch Now entry's "updated" date specified, given that FR-021 gives text but no date? [Gap, Spec §FR-021]

## Reading Path Validation

- [ ] CHK010 Is "does not exist" defined for an item that exists but is a draft in a production build, so the missing-item error and the draft-omission rule cannot be confused? [Ambiguity, Spec §FR-012, §FR-013]
- [ ] CHK011 Are the limits (one to four paths, one to five items) stated with the behaviour at each boundary, including zero paths? [Completeness, Spec §FR-014, §US2-AS5]
- [ ] CHK012 Is the path count limit applied before or after draft removal, and is that stated? [Ambiguity, Spec §FR-013, §FR-014]
- [ ] CHK013 Is the "same item twice" rule defined for the same slug in the same collection versus a post and project sharing a slug? [Edge Case, Spec §FR-012]
- [ ] CHK014 Is the display order of paths defined (the data model adds a unique position field that the spec never mentions)? [Gap, Spec §FR-008, Data Model]
- [ ] CHK015 Are the description rules (one sentence, length limit) in the data model traceable to a spec requirement? [Traceability, Spec §FR-008, Data Model]
- [ ] CHK016 Is it specified what happens in a non-production build (preview, dev) to draft items, so previews and production differ only as intended? [Gap, Spec §FR-013]
- [ ] CHK017 Is the case of a path whose only items are drafts in production, while the section as a whole has other visible paths, covered in a single clear rule? [Coverage, Spec §FR-013]

## Error Message Quality

- [ ] CHK018 Does every build failure requirement say what the message must contain (file, path name, item, rule broken)? [Completeness, Spec §FR-006, §FR-012, §FR-014]
- [ ] CHK019 Are all failure conditions in the spec present in the build-errors contract, and all contract errors traceable to the spec? [Traceability, Contracts/build-errors]
- [ ] CHK020 Is it stated whether several errors are reported together or only the first, when more than one rule is broken? [Gap]
- [ ] CHK021 Is "clear message" (FR-006) defined as something reviewable, such as naming the file and field? [Measurability, Spec §FR-006]

## Reading Time and Derived Data

- [ ] CHK022 Is the project story reading-time rule defined for which text counts (story body only, excluding front matter and call to action)? [Clarity, Spec §Assumptions]
- [ ] CHK023 Is the shared reading-speed rule referenced to one source of truth so posts and projects cannot diverge? [Consistency, Spec §FR-010]
- [ ] CHK024 Does the spec define behaviour if a referenced post's title or body changes after the path was written (derived at build, never copied)? [Assumption, Spec §Key Entities]

## Launch Content Integrity

- [ ] CHK025 Are the launch path items in FR-022 identified by something checkable (slug or title) and are all named items confirmed to exist and be published today? [Traceability, Spec §FR-022]
- [ ] CHK026 Is the spec's assumption of "four posts and five project stories" consistent with FR-022 naming three projects and two posts? [Consistency, Spec §Assumptions]
- [ ] CHK027 Is the "no Cloud Architect wording" requirement scoped to a defined set of files so it can be checked objectively? [Measurability, Spec §FR-020]
- [ ] CHK028 Is the removal of the old paragraphs and "What I do" section paired with a requirement about any links or content other pages depended on? [Dependency, Spec §FR-016]
- [ ] CHK029 Are no-code-change requirements (FR-005, FR-011) bounded so that test fixtures and visual baselines that mention launch content are covered? [Gap, Spec §SC-002]
