# Contract: assessment data file and MDX components

**Feature**: `037-wayfinder-self-assessment` | Entities: [../data-model.md](../data-model.md)

## The data file

`src/content/assessments/<id>.yaml`, one assessment per file, loaded by the `assessments`
collection (`glob()` loader, pattern `*.yaml`, base `./src/content/assessments`) and validated by
`src/content/schemas/assessment.ts`. Shape (values abridged):

```yaml
title: Where do you sit?
intro: >-
  Fifteen short statements, three for each shift. Answer for how you usually act...
scale: [Rarely, Sometimes, Often, Usually, Almost always]
shifts:
  - id: see-the-whole-system
    name: See the Whole System
    from: Fixing individual problems in isolation
    to: Understanding interconnections and root causes
    anchor: mindset-shift-1-see-the-whole-system
    practicalApplication: >-
      Before proposing solutions, create a simple systems map ...
    week: >-
      Create systems maps for 2-3 current challenges. ...
    statements:
      - Before I propose a fix, I ask who else the problem affects.
      - ...
      - ...
  # four more shifts, in the post's order
integrationWeek:
  name: Integration and Reflection
  week: >-
    Assess which mindset shifts feel natural ...
```

The `practicalApplication` and `week` texts are the post's current text, moved unchanged. The
statement wording is drafted during implementation from the post (spec Assumptions) and Don
edits it in review.

## MDX components (posts only)

Passed by `src/pages/writing/[slug].astro` through `<Content components={...} />`; the post
body uses them with no import. `validatePageBody(file, body, "post")` accepts these two tag
names in addition to the page sections; a page body still rejects them.

| Tag | Props | Renders |
|-----|-------|---------|
| `<PracticalApplication assessment="wayfinder" shift="see-the-whole-system" />` | `assessment` (entry id), `shift` (shift id) | `<p><strong>Practical Application</strong>: <text></p>`, the same markup the Markdown produced before (so the post reads the same). |
| `<SelfAssessment assessment="wayfinder" />` | `assessment` | The assessment block ([assessment-ui.md](./assessment-ui.md)). Its `##` heading is written in the post's Markdown just above the tag, so it is in the heading outline and Don owns its wording (FR-001). |

Every component also takes an optional `data` prop (the parsed assessment) that replaces the
collection lookup; only component tests use it.

## Placement in the Wayfinder post

- Each `**Practical Application**: ...` paragraph is replaced by its
  `<PracticalApplication ... />` tag, in place.
- The "Practical First Steps" section (with "Immediate Actions" and the 6-Week Development Plan)
  is removed; the post ends with "Printable Resources" (spec Clarifications, PR #176 decision,
  2026-10-11). The week texts and the integration week appear only in the printed plan.
- `## <assessment heading>` and `<SelfAssessment ... />` go after the Mindset Shift #5 section's
  closing paragraph ("Putting these mindsets into practice...") and before
  `## The Systems Leadership Wayfinder` (FR-001).
- No Practical Application text remains in the post prose (FR-004).

## Question source (FR-021)

`src/lib/assessment/question-text.ts` exports a pure `expandForQuestions(body, assessments)`:
each `<PracticalApplication assessment="a" shift="s" />` becomes
`**Practical Application**: <practicalApplication>`; each `<SelfAssessment ... />` is removed. Other text is untouched. The post route and
`src/pages/writing/[slug]/question-source.json.ts` call it and pass the result as `body` to
`prepareQuestionSource()`, so the text and the hash both reflect the data file.

## Build errors

Each fails `astro sync` / `astro build` with a message naming the file. Row ids continue the
post rows in `docs/posts.md` under a new "A" prefix.

| Row | Cause | Where checked | Message contains |
|-----|-------|---------------|------------------|
| A1 | Data file breaks the schema (missing or empty text field, unknown key, wrong count of shifts or statements, scale not five labels) | collection schema (Astro's own error) | the file name and the field path |
| A2 | Two shifts with the same `id` or the same `anchor` | schema refinement | `shifts`, the repeated value |
| A3 | `scale` first/last label not "Rarely"/"Almost always" | schema refinement | `scale` |
| A4 | A component names an assessment id with no data file | component, through `Astro.locals.pageFile` | post file, `assessment="<id>"`, the known ids |
| A5 | `PracticalApplication` names a shift id the assessment does not have | component | post file, `shift="<id>"`, the known shift ids |
| A6 | A shift's `anchor` is not the id of a heading in a post that renders `SelfAssessment` for that assessment | post route, against `render(entry).headings` | post file, shift name, the anchor |
| A7 | A post renders `SelfAssessment` for the same assessment twice | post route | post file |
| A8 | `<Something>` that is neither a section nor one of the two post components | `validatePageBody` (existing P19 wording, list extended for posts) | the tag and the allowed names |
| A9 | In a post that renders `SelfAssessment`, a shift's `**From**:` or `**To**:` line in the section under its `anchor` heading differs from the data file's `from` / `to` (FR-004) | post route (`src/lib/assessment/checks.ts`) | post file, shift name, `from` or `to`, both texts |
| A10 | A post that uses either component still contains, verbatim in its MDX body, a `practicalApplication` text of that assessment (FR-004) | post route (`src/lib/assessment/checks.ts`) | post file, the field (`practicalApplication` of `<shift>`) |

The `version` is derived, not authored (research R5), so it has no error row; any statement
wording or order edit changes it.
