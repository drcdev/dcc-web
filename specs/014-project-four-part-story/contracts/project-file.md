# Contract: a project file

Supersedes `specs/009-portfolio/contracts/project-file.md`. This is the shape
`src/content/projects/_template.mdx` shows and `docs/projects.md` explains. Field rules are in
[../data-model.md](../data-model.md); the errors for breaking them are in
[build-errors.md](./build-errors.md).

```mdx
---
title: Example project
problem: Say in one sentence what problem the project solved.
description: One sentence for search results and sharing.
themes: [Example theme]
status: experiment
date: 2026-01-01
visual:
  kind: image
  src: ./images/template/diagram.svg
  alt: Describe the list picture
visuals:
  architecture:
    kind: diagram
    src: ./images/template/diagram.svg
    alt: Describe the diagram
    description: Say in words what the diagram shows.
    part: build
standIn:
  href: https://example.com/
  label: Example project on drc.dev
source: https://github.com/drcdev/example
invitation: If you have a problem like this one, tell me about it.
draft: true
---

{/* Notes to yourself are MDX comments like this one. They are never shown. */}

## Problem

What was wrong, for whom, and why it mattered.

## Options

A paragraph on the routes that were open.

- **Works offline**: why this mattered.
- **Low cost**: why this mattered.

| Option | Works offline | Low cost |
| --- | --- | --- |
| An existing app | yes | partly |
| **A small custom app** | yes | yes |

Why the custom app won: one or more sentences.

## Build

What was built and how it turned out.

## Lessons

What the project taught.
```

Rules a writer has to know (each enforced by the build):

1. Exactly four `##` headings: `Problem`, `Options`, `Build`, `Lessons`, in that order. Use
   `###` for anything smaller.
2. No tags, imports or images in the body. Pictures go in `visuals`, each with `part:` naming
   the part it sits beside (at most one per part).
3. In Options: a constraint list (each item a **bold label**, a colon, an explanation), then one
   table whose first column names the options and whose other column headings are the bold
   labels in the same order, every cell `yes`, `partly` or `no`, exactly one option name fully
   in bold, then a line starting `Why`.
4. Links and the closing invitation are added by the page. `invitation:` is optional; without
   it a standard sentence is used.
5. A file whose name starts with `_` is not a project.
