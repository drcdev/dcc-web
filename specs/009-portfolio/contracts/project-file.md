# Contract: a project file

The authoring contract Don (and Claude) write to. `docs/projects.md` (FR-075) is the plain-language
version of this contract. Data rules are in [../data-model.md](../data-model.md).

## Location

```text
src/content/projects/<slug>.mdx             one file per project; <slug> becomes /projects/<slug>/
src/content/projects/images/<slug>/…         its images, SVG diagrams, clips and posters
```

Adding a project touches nothing else (SC-004).

## Settings (frontmatter)

```yaml
---
title: Focus Pocus
problem: Managing OmniFocus meant switching apps and clicking through screens.
description: How Focus Pocus lets Claude Desktop manage OmniFocus tasks by conversation.
themes: [AI integration, Automation, macOS]
status: experiment                      # shipped | experiment | in-progress
visual:
  kind: image
  src: ./images/focus-pocus/index.png
  alt: Claude Desktop answering a question about this week's OmniFocus tasks
  placeholder: true
order: 1                                # optional
date: 2025-06-01                        # optional
standIn:                                # or demo: { href: https://drc.dev/…, embed: true, title: … }
  href: https://drc.dev/projects/focus-pocus
  label: Focus Pocus on drc.dev
source: https://github.com/drcdev/focus-pocus   # optional
draft: false                             # optional; true hides the whole project from production.
                                         # Focus Pocus is published (false) with its draft chapters
                                         # marked by <Chapter draft> and its placeholders by placeholder: true
visuals:
  screenshot: { kind: image, src: ./images/focus-pocus/screenshot.png, alt: "…", placeholder: true }
  architecture: { kind: diagram, src: ./images/focus-pocus/architecture.svg, alt: "…", description: "…" }
comparison:
  constraints:
    - { id: macos-only, label: Works on macOS, detail: "…" }
    - { id: natural-dates, label: Natural-language dates }
  options:
    - id: url-scheme
      name: OmniFocus URL scheme
      summary: Open omnifocus:// links to add or change tasks.
      fit: { macos-only: meets, natural-dates: misses }
      cons: [Cannot read tasks back.]
    - id: jxa-mcp
      name: JXA behind an MCP server
      summary: "…"
      fit: { macos-only: meets, natural-dates: meets }
      chosen: true
      reason: It is the only route that can read and change tasks and fits Claude Desktop's MCP model.
---
```

## Body: building blocks

Available without imports. Page sections (`Figure`, `TextBlock`, `Lead`, `CallToAction`,
`WideImage`, `FullImage`, …) may also be used inside a chapter. Body headings start at `###`.

| Block | Props | Where | Renders |
|---|---|---|---|
| `<Chapter stage="…" visual="name" draft>` … `</Chapter>` | `stage` (required, one of the seven ids), `visual` (optional name from `visuals`, or `demo`), `draft` (optional flag: shows a visible "Draft for review" mark on the chapter) | Seven, in the fixed order, each once | `section` with number, `h2`, text, visual panel beside (wide, motion allowed) or after |
| `<Visual name="…" />` | `name` | Anywhere inside a chapter | The named visual as a figure (image, diagram + description, or clip) |
| `<OptionComparison />` | none | Once, inside `stage="options"` | Constraints × options table in a labelled scroll region, chosen mark, reason |
| `<Demo />` | none | At most once, inside `stage="built"`; required there when `demo`, `standIn` or `source` is set | Demo link, or stand-in link with "not a live demo" note, plus source-code link |
| `<Invitation />` | none | Once, inside `stage="invitation"` | Link to `/contact/?project=<slug>`, accessible name includes the title |

Skeleton every project follows:

```mdx
<Chapter stage="problem" visual="screenshot">
Who had the problem and what it was.
</Chapter>
<Chapter stage="constraints">…</Chapter>
<Chapter stage="options">
Short framing.

<OptionComparison />
</Chapter>
<Chapter stage="built" visual="architecture">
…

<Demo />
</Chapter>
<Chapter stage="outcome">…</Chapter>
<Chapter stage="lessons">…</Chapter>
<Chapter stage="invitation">
If a tool you use every day could work better with an AI assistant, tell me about it.

<Invitation />
</Chapter>
```
