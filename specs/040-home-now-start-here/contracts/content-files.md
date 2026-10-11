# Contract: the content files Don edits

Neither file needs a code change to edit (FR-005, FR-011). See data-model.md for the field rules.

## `src/content/now/now.md`

```markdown
---
updated: 2026-10-01
workingOn: Leading data warehousing, data modernization, and AI support and compliance at Island Health.
reading: Wool by Hugh Howey
mbaResearch: Researching the experienced value of the Certified Health Executive (CHE) designation for my MBA at Royal Roads University.
aiExperiments: "Building this site with Claude Code and Spec Kit: agents write the specs, tests and code, and I review every change."
---

I'm open to speaking and to mentoring conversations with healthcare and technology leaders. [Get in touch](/contact/).
```

- To update it, change the text and `updated`, then commit. Nothing else changes.
- Quote a value that contains `: ` (YAML), as `aiExperiments` does above.
- The `updated` date to set at launch is the implementation date or earlier. It must not be later than the build date.

## `src/content/reading-paths/<id>.yaml`

`leading-change-in-healthcare.yaml`:

```yaml
title: Leading change in healthcare
description: For leaders taking a team through complex change.
position: 1
items:
  - post: the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change
  - post: starting-something-new
```

`building-with-ai-agents.yaml`:

```yaml
title: Building with AI agents
description: For people curious about letting AI do the build.
position: 2
items:
  - post: building-focus-pocus-what-i-learned-about-ai-coding-and-integration
  - project: cadence
  - project: drcdev-github-io
  - project: flux
```

- **Add a path**: add a file with the next free `position`. There can be at most four.
- **Remove a path**: delete its file.
- **Reorder paths**: change `position`.
- **Reorder items**: reorder the list.
- An item names a post or project by its file name without `.mdx`.
- The descriptions above are draft wording for Don to edit in review (spec Assumptions).
