# Adding and editing projects

Every project on the site is one file in `src/content/projects/`, plus its pictures. Add the
file and the pictures, commit, and the project appears on the Projects page and gets its own
story page. There is nothing else to register or edit.

## Where the files go

The file name is the address.

| File | Address |
|---|---|
| `src/content/projects/focus-pocus.mdx` | `/projects/focus-pocus/` |

Use lower-case letters, digits and hyphens only, and put the file straight in
`src/content/projects/` (no subfolders). Do not have both `focus-pocus.md` and
`focus-pocus.mdx`. Put pictures and clips in `src/content/projects/images/<project-name>/` and
point to them with paths that start `./images/`, as in the example below.

## The top of the file

```yaml
---
title: Focus Pocus
problem: Managing OmniFocus meant switching apps and clicking through screens.
description: How Focus Pocus lets Claude Desktop manage OmniFocus tasks by conversation.
themes: [AI integration, Automation, macOS]
status: experiment
visual:
  kind: image
  src: ./images/focus-pocus/index.png
  alt: Claude Desktop answering a question about this week's OmniFocus tasks
  placeholder: true
---
```

The settings between the two `---` lines, in the order you will usually write them:

| Setting | Needed | What it does |
|---|---|---|
| `title` | yes | The project name, shown as the main heading and on its card. |
| `problem` | yes | The problem in one sentence of at most 140 characters, ending with a full stop, question mark or exclamation mark. It is the card text on the Projects page. |
| `description` | yes | A short summary for search results and link previews. |
| `themes` | yes | One to four themes, such as `[AI integration, Automation]`. Visitors filter the Projects page by them. Do not repeat a theme. |
| `status` | yes | One of `shipped`, `experiment` or `in-progress`. |
| `visual` | yes | The picture on the project's card. See "Pictures and clips". It must be an `image` or a `diagram` (not a clip). |
| `comparison` | yes | The options you weighed. See "The comparison". |
| `order` | no | Position on the Projects page, a whole number from 1. Projects without one follow, newest `date` first. |
| `date` | no | When the project was made, like `2025-06-01`. Used to sort projects without an `order`. |
| `demo` | no | A live demo on drc.dev: `href` (an https address on drc.dev or a subdomain), optional `title`, and `embed: true` to show it inside the story. Use either `demo` or `standIn`, not both. |
| `standIn` | no | For a project with no live demo yet: `href` (an https address) and an optional `label`. The story says it is not a live demo. |
| `source` | no | The source code address (https). |
| `image` | no | The picture shown when the page is shared: `src` and `alt`. Without it the site picture is used. |
| `draft` | no | `true` hides the whole project from the live site. It still shows when you preview locally. |
| `visuals` | no | Named pictures and clips you use in the story. See below. |

A setting the site does not know (for example `titel`) stops the build, so typos cannot hide.

## Pictures and clips

A picture is written like this (the same shape is used for `visual`, for each entry in
`visuals` and for `image`):

```yaml
kind: image                 # image, diagram or clip
src: ./images/focus-pocus/screenshot.png
alt: Claude Desktop listing tasks       # required: describe the picture
placeholder: true           # optional: marks it "Placeholder" until the real one arrives
```

Before adding a photo, remove its location and camera details (the hidden information such
as where it was taken and what phone or camera took it). The site does not do this for you.

- `image`: a picture. `src` and `alt` are needed.
- `diagram`: a picture of a diagram (an SVG works well). It also needs a `description` that
  says in words what the diagram shows.
- `clip`: a short video (`.webm` or `.mp4`, 5 MB at most). It needs `src`, a `poster` picture
  shown before it plays, a `label`, and a `description` in words. Clips never play on their
  own; visitors press play.

Named pictures go under `visuals`, and each name is then used in the story:

```yaml
visuals:
  screenshot:
    kind: image
    src: ./images/focus-pocus/screenshot.png
    alt: Claude Desktop listing tasks
  architecture:
    kind: diagram
    src: ./images/focus-pocus/architecture.svg
    alt: The parts of Focus Pocus
    description: Claude Desktop calls a small server, which talks to OmniFocus.
```

Names use lower-case letters, digits and hyphens and start with a letter. The name `demo` is
reserved for the embedded demo. A missing file stops the build and names the path.

## The comparison

`comparison` lists what mattered and the ways you could have done it. It becomes the table in
the "options" chapter.

```yaml
comparison:
  caption: How the options measured up      # optional
  constraints:
    - { id: macos-only, label: Works on macOS, detail: Runs on my own Mac. }
    - { id: natural-dates, label: Natural-language dates }
  options:
    - id: url-scheme
      name: OmniFocus URL scheme
      summary: Open omnifocus:// links to add or change tasks.
      fit: { macos-only: meets, natural-dates: misses }
      cons: [Cannot read tasks back.]
    - id: jxa-mcp
      name: JXA behind an MCP server
      summary: Script OmniFocus and expose it to Claude.
      fit: { macos-only: meets, natural-dates: partly }
      pros: [Reads and changes tasks.]
      chosen: true
      reason: It is the only route that can read and change tasks.
```

- Each `constraints` entry has an `id`, a `label` and an optional `detail`.
- Each `options` entry has an `id`, a `name`, a `summary` and a `fit` for every constraint,
  using the constraint's `id`. A fit is `meets`, `partly` or `misses`. `pros` and `cons` are
  optional lists.
- Exactly one option is `chosen: true`, and only that option has a `reason`.
- Ids use lower-case letters, digits and hyphens and start with a letter. No id repeats.

## The story (below the settings)

Every project tells its story in seven chapters, in this fixed order, each once:
`problem`, `constraints`, `options`, `built`, `outcome`, `lessons`, `invitation`. The site
adds the chapter number and the heading. Write only the text.

```mdx
<Chapter stage="problem" visual="screenshot">
Who had the problem and what it was.
</Chapter>

<Chapter stage="constraints" visual="architecture">
What made it hard.
</Chapter>

<Chapter stage="options">
Short framing.

<OptionComparison />
</Chapter>

<Chapter stage="built">
What was built.

<Demo />
</Chapter>

<Chapter stage="outcome">
How it turned out.
</Chapter>

<Chapter stage="lessons">
What was learned.
</Chapter>

<Chapter stage="invitation">
If a tool you use every day could work better with an AI assistant, tell me about it.

<Invitation />
</Chapter>
```

Leave a blank line after an opening tag and before a closing tag when the block has text
inside. In the body, headings start at `###` (the chapter headings are set for you), and every
picture written as `![alt text](./images/file.png)` needs alt text.

## The blocks

Available with no import.

`Chapter`: one chapter. `stage` is required. `visual` is optional and names an entry in
`visuals`, or `demo` to show the embedded demo beside the text (this needs `embed: true` under
`demo`). Add `draft` (write `<Chapter stage="lessons" draft>`) to show a visible "Draft for
review" mark while the text is unfinished.

`Visual`: `<Visual name="screenshot" />` shows one of the named pictures anywhere inside a
chapter.

`OptionComparison`: `<OptionComparison />` shows the comparison table. It goes once, inside
the `options` chapter, and every project needs it.

`Demo`: `<Demo />` shows the demo link, or the stand-in link with a "not a live demo" note,
and the source link. It goes once, inside the `built` chapter, and is needed there whenever
`demo`, `standIn` or `source` is set.

`Invitation`: `<Invitation />` is the link that invites a visitor to get in touch about a
project like this. It goes once, inside the `invitation` chapter, and every project needs it.

These page sections also work inside a chapter (see [pages.md](pages.md) for how each is
written): `Lead`, `TextBlock`, `Figure`, `WideImage`, `FullImage`, `CallToAction`, `Offerings`,
`Offering` and `ContactForm`.

## Drafts and placeholders

- `draft: true` in the settings hides the whole project from the live site while you write it.
- `<Chapter draft>` marks one unfinished chapter on a published project.
- `placeholder: true` on a picture shows a "Placeholder" mark until you swap in the real one.
  Remove the line when you do.

## Build errors you may see

The build stops at the first problem and names the file. Messages start with `Project file`
(or `Project files` when two files clash) or name the project in a "data does not match" note.

- A missing or misspelled setting, a wrong kind of value (for example `order: first`), or a
  `status` that is not one of the three allowed words.
- No themes at all, more than four themes, or the same theme twice.
- An `order` that is not a whole number of 1 or more (0, below 0, or a fraction).
- A visual name under `visuals` that is not lower-case letters, digits and hyphens starting
  with a letter, or that uses the reserved name `demo`.
- A clip used as the index visual (the `visual` on the project's card): it must be an image or a diagram.
- Two options, or two constraints, with the same `id`.
- An unsupported picture or clip file type (use a common picture format for pictures, and
  `.webm` or `.mp4` for clips).
- A page elsewhere on the site that claims an address under `/projects/`; that address belongs
  to the projects.
- A `problem` over 140 characters or with more than one sentence.
- A picture with no `alt`, a diagram with no `description`, a clip with no `description`, or a
  file that does not exist. A clip over 5 MB.
- A `demo` address that is not on drc.dev, or a `source` or `standIn` address that is not
  https. Both `demo` and `standIn` set.
- A comparison with no options, no constraints, no chosen option, two chosen options, a chosen
  option with no reason, a reason on an option that is not chosen, a missing `fit`, or a `fit`
  for a constraint that does not exist.
- A chapter that is missing, repeated or out of order.
- `<OptionComparison />`, `<Invitation />` or `<Demo />` missing, repeated or in the wrong
  chapter.
- A block that does not exist (for example `<Timeline>`); the message lists the real ones.
- A `visual` name that is not under `visuals`, or `visual="demo"` without `embed: true`.
- A `#` or `##` heading in the body: use `###`.
- A picture in the body with no alt text.
- Two files with the same address (`x.md` and `x.mdx`), a file in a subfolder, or a file name
  with anything other than lower-case letters, digits and hyphens.
