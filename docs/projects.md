# Adding and editing projects

Every project on the site is one file in `src/content/projects/`, plus its pictures. Add the
file and the pictures, commit, and the project appears on the Projects page and gets its own
story page. There is nothing else to register or edit.

The quickest start is the template. Copy `src/content/projects/_template.mdx` to a new file
name (for example `my-project.mdx`), then replace every line. The template is never published
itself, because a file whose name starts with an underscore is not a project. Its notes to
yourself are comments in the file; they are never shown on the page.

## Where the files go

The file name is the address.

| File | Address |
|---|---|
| `src/content/projects/focus-pocus.mdx` | `/projects/focus-pocus/` |

Use lower-case letters, digits and hyphens only, and put the file straight in
`src/content/projects/` (no subfolders). Do not have both `focus-pocus.md` and
`focus-pocus.mdx`. Put pictures in `src/content/projects/images/<project-name>/` and point to
them with paths that start `./images/`, as in the example below.

## The top of the file

```yaml
---
title: Focus Pocus
problem: Managing OmniFocus meant switching apps and clicking through screens.
description: How Focus Pocus lets Claude Desktop manage OmniFocus tasks by conversation.
themes: [AI integration, Automation, macOS]
status: experiment
date: 2025-06-01
visual:
  kind: image
  src: ./images/focus-pocus/index.png
  alt: Claude Desktop answering a question about this week's OmniFocus tasks
visuals:
  architecture:
    kind: diagram
    src: ./images/focus-pocus/architecture.svg
    alt: The parts of Focus Pocus
    description: Claude Desktop calls a small server, which talks to OmniFocus.
    part: build
invitation: If a tool you use every day could work better with an AI assistant, tell me about it.
draft: true
---
```

The settings between the two `---` lines:

| Setting | Needed | What it does |
|---|---|---|
| `title` | yes | The project name, shown as the main heading and on its row in the list. |
| `problem` | yes | The problem in one sentence of at most 140 characters, ending with a full stop, question mark or exclamation mark. It is the row text on the Projects page. |
| `description` | yes | A short summary for search results and link previews. |
| `themes` | yes | One to four themes, such as `[AI integration, Automation]`. Visitors filter the Projects page by them. Do not repeat a theme. |
| `status` | yes | One of `shipped`, `experiment` or `in-progress`. |
| `date` | yes | When the project was made, like `2025-06-01`. The Projects page lists the newest first. |
| `visual` | yes | The picture on the project's row. See "Pictures". |
| `visuals` | no | Named pictures for the story, each beside one part. See "Pictures". |
| `demo` | no | A live demo on drc.dev: `href` (an https address on drc.dev or a subdomain) and an optional `title`. Use either `demo` or `standIn`, not both. |
| `standIn` | no | For a project with no live demo yet: `href` (an https address) and an optional `label`. The story says it is not a live demo. |
| `source` | no | The source code address (https). |
| `image` | no | The picture shown when the page is shared: `src` and `alt`. Without it the site picture is used. |
| `invitation` | no | Your own closing sentence inviting a visitor to get in touch. Leave it out, or leave it empty, for the standard sentence. |
| `draft` | no | `true` hides the whole project from the live site. It still shows when you preview locally, marked "Draft for review". |

The links to the demo (or stand-in) and the source, and the closing invitation, are added to
the page for you from these settings. You do not write them in the story.

A setting the site does not know (for example `titel`) stops the build, so typos cannot hide.
The old settings `order` and `comparison`, the demo's embed switch and video pictures were
removed; using one stops the build and names it.

## Pictures

A picture is written like this (the same shape is used for `visual`, for each entry in
`visuals` and for `image`):

```yaml
kind: image                 # image or diagram
src: ./images/focus-pocus/screenshot.png
alt: Claude Desktop listing tasks       # required: describe the picture
placeholder: true           # optional: marks it "Placeholder" until the real one arrives
```

Before adding a photo, remove its location and camera details (the hidden information such
as where it was taken and what phone or camera took it). The site does not do this for you.

- `image`: a picture. `src` and `alt` are needed.
- `diagram`: a picture of a diagram (an SVG works well). It also needs a `description` that
  says in words what the diagram shows.

Pictures for the story go under `visuals`. Each has a name you choose, and a `part` that says
which part it sits beside: `problem`, `options`, `build` or `lessons`. Each part has at most
one picture. A picture with no `part` is kept in the file but not shown in the story.

```yaml
visuals:
  screenshot:
    kind: image
    src: ./images/focus-pocus/screenshot.png
    alt: Claude Desktop listing tasks
    part: problem
  architecture:
    kind: diagram
    src: ./images/focus-pocus/architecture.svg
    alt: The parts of Focus Pocus
    description: Claude Desktop calls a small server, which talks to OmniFocus.
    part: build
```

Names use lower-case letters, digits and hyphens and start with a letter. A missing file stops
the build and names the path. The list picture (`visual`) has no `part`.

## The story (below the settings)

Every project tells its story in four parts, always these headings, each once, in this order.
Write them as `##` headings and write only plain Markdown under them:

```md
## Problem

Who had the problem, what it was, and why it mattered.

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

Use `###` for anything smaller inside a part. Notes to yourself can be comments like
`{/* a note */}`; they are never shown. Do not write tags (anything in angle brackets), imports or
pictures in the body: pictures go in `visuals`, and the links and invitation come from the
settings.

### The Options table

The Options part has three pieces, in this order:

1. A list of what mattered (the constraints). Each item is a **bold label**, a colon, then a
   sentence on why it mattered.
2. One table. The first column names the options; every other column heading is one of the
   bold labels, in the same names and the same order. Every cell is `yes`, `partly` or `no`
   (capital letters are fine). Use each option name once. Exactly one option name is entirely
   in bold: the one you chose.
3. A paragraph that starts with the word `Why`, saying why that option won.

The site draws the table with coloured answers and a mark on the chosen option. The list and
the "Why" paragraph are shown as you wrote them.

## Drafts and placeholders

- `draft: true` in the settings hides the whole project from the live site while you write it.
  Keep it until you are ready to publish, then change it to `false`.
- `placeholder: true` on a picture shows a "Placeholder" mark until you swap in the real one.
  Remove the line when you do.

## Build errors you may see

The build stops at the first problem and names the file. Messages start with `Project file`
(or `Project files` when two files clash) or name the project in a "data does not match" note.

- A missing or misspelled setting, a wrong kind of value, or a `status` that is not one of the
  three allowed words.
- A removed setting: `order`, `comparison`, or the demo's embed switch.
- No themes at all, more than four themes, or the same theme twice.
- A visual name under `visuals` that is not lower-case letters, digits and hyphens starting
  with a letter.
- A `part` that is not `problem`, `options`, `build` or `lessons`.
- Two pictures for the same part.
- A part that is missing, renamed, repeated or out of order, an extra `##` heading, or a `#`
  heading in the body.
- Text before the first part (other than comments).
- A tag (anything in angle brackets), an `import` or `export`, or a picture in the body. Plain Markdown only.
- No Options table, more than one, or a table with no constraint columns or a row with the wrong number of cells.
- A table cell that is not yes, partly or no.
- No option in bold, more than one, or an option only partly in bold.
- A constraint list that is missing, or an item without a bold label and a colon.
- A constraint list whose bold labels are not the same names in the same order as the table's column headings.
- Two options, or two constraints, with the same name.
- No paragraph starting with the word `Why` straight after the table.
- An unsupported picture file type (use a common picture format), a picture with no `alt`, a
  diagram with no `description`, or a file that does not exist.
- A page elsewhere on the site that claims an address under `/projects/`; that address belongs
  to the projects.
- Two files with the same address (`x.md` and `x.mdx`), a file in a subfolder, or a file name
  with anything other than lower-case letters, digits and hyphens.
- A `problem` over 140 characters or with more than one sentence.
- A `demo` address that is not on drc.dev, or a `source` or `standIn` address that is not
  https. Both `demo` and `standIn` set.
