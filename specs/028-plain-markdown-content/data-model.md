# Data model: Plain Markdown for standard content (028)

No stored data changes. The "entities" are the content-authoring vocabulary checked at build.

## Section (registry)

Source: `src/components/sections/index.ts` (`sectionNames`, `sectionComponents`), props schemas
in `src/components/sections/schemas.ts`.

| Name | Props | Inside it | Change |
|------|-------|-----------|--------|
| `Lead` | none | text | unchanged |
| `CallToAction` | `label`, `href` | optional text | unchanged |
| `Figure` | `caption?` | exactly one image | unchanged |
| `WideImage` | `caption?` | exactly one image | unchanged |
| `FullImage` | `caption?` | exactly one image | unchanged |
| `SideImage` | none | one image and text | unchanged |
| `ContactForm` | none | nothing | unchanged |
| `RecentWriting` | none | nothing | unchanged |
| ~~`TextBlock`~~ | ~~`title`~~ | ~~text~~ | **removed** |
| ~~`Offerings`~~ | ~~`title?`~~ | ~~at least one `Offering`~~ | **removed** |
| ~~`Offering`~~ | ~~`title`, `href?`~~ | ~~text~~ | **removed** |

Validation rules:

- A capitalised tag outside code in a page or post body that is not one of the eight fails the
  build with `<Tag> is not a section. The sections are: Lead, CallToAction, Figure, WideImage,
  FullImage, SideImage, ContactForm, RecentWriting.` (order as in `sectionNames`), prefixed with
  the file (`contracts/content-rules.md`).
- The section `content` summary becomes `{ text: boolean, images: number }`; the `offerings`
  counter is removed with the section that used it.
- Project bodies keep their own rules (any section tag fails), unchanged.

## Heading address

- Every Markdown heading (`##` to `######`) in a page, post or project body gets an `id` from
  Astro's built-in heading ids (github-slugger; research R1). Duplicate texts on one page get
  `-1`, `-2` suffixes.
- The link target is `<page address>#<id>`, for example `/work-with-me/#consulting`.
- No new field, frontmatter key or plugin.

## Work with me page (content shape)

`src/content/pages/work-with-me.mdx`, frontmatter unchanged (`draft: true`, `nav.position: 2`).
Body, in order (FR-004, FR-005):

1. `<Lead>` (unchanged text)
2. `## Speaking topics` then three `###` topics, each followed by its paragraph
3. `## Past talks` + paragraph
4. `## Consulting` + the bold note paragraph + one paragraph
5. `## Kinds of work` then three `###` kinds, each followed by its paragraph
6. `## How I work` + two paragraphs
7. `## What I don't do` + the two-item list
8. `<CallToAction label="Get in touch" href="/contact/">` (unchanged)

Wording is copied unchanged from the current file; only the wrapping tags become Markdown.
