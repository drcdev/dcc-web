# Adding and editing pages

Every page on the site is one file in `src/content/pages/`. Add the file, commit, and the page
exists. There is nothing else to register. Projects work the same way and have their own guide:
see [projects.md](projects.md).

## Where the file goes

The file name is the address.

| File | Address |
|---|---|
| `src/content/pages/about.mdx` | `/about/` |
| `src/content/pages/index.mdx` | `/` (the home page) |
| `src/content/pages/work-with-me.mdx` | `/work-with-me/` |

Use lower-case letters, digits and hyphens only. Use `.mdx` when you want the components below;
plain `.md` works for text only. Put images next to the page in `src/content/pages/images/`.

## The top of the file

```yaml
---
title: Work with me
description: The work Don Coleman is considering taking on and the talks he gives.
nav:
  position: 2
draft: true
---
```

| Key | Needed | What it does |
|---|---|---|
| `title` | yes | The main heading and the browser tab title. |
| `description` | yes | The summary shown in search results and link previews. About 50 to 160 characters reads best; this is not enforced. |
| `image` | no | Sharing image: `src` (a file path) and `alt` (required). Without it the site default is used. |
| `featureImage` | no | A picture at the top of the page: `src`, `alt` (required) and optional `caption`. |
| `nav` | no | Puts the page in the header menu. Leave it out to keep the page out of the menu. |
| `nav.position` | with `nav` | Menu order, a whole number from 1. |
| `nav.label` | no | Menu text. Defaults to `title`. |
| `draft` | no | `true` keeps the page published with a "draft" notice, but asks search engines not to index it and leaves it out of the sitemap. |
| `intro` | no | Home page only: the introduction card (`photo`, `name`, `tagline`, `bio`, `cta`). |

Do not write a `# Heading` in the body; the title is the page's only main heading. Use `##`.

## Menu positions and taken addresses

Positions 4, 5 and 7 belong to Writing, Projects and Contact, and About is at 6. Work with me is at 2, so 3 is free. Pick another number; a clash
stops the build. The addresses `/writing/` and `/projects/` belong to the Writing and Projects
pages, `/contact/` is `contact.mdx`, and any address another part of the site already uses
(such as `/404/`) is taken too; a page file at one of them stops the build.

## Writing the page

Write the body as plain Markdown: headings, paragraphs, lists, tables, quotes, links and
emphasis. Components are only for what Markdown cannot do: an intro paragraph, a button link,
an image with a caption, the contact form and the recent writing list.

A titled passage is a `##` heading and the text under it. A group of items is a `##` heading
with a `###` heading for each item. Never put a `###` directly under the page title.

```mdx
## How I work

Short engagements, written advice, and no lock-in.

## Kinds of work

### [Architecture reviews](/contact/)

An outside view of a system before a big decision.

### Advice on technology change

A second opinion on a plan before it is committed.
```

Put headings in the body, not inside a component.

### Linking to a heading

Every heading from `##` to `######` gets an address. It is the heading text in lower case, with
spaces changed to hyphens and most punctuation dropped. A second heading with the same text
gets `-1` and a third gets `-2`. "Kinds of work" becomes `kinds-of-work`, so this link jumps to
it:

```mdx
See [the kinds of work](/work-with-me/#kinds-of-work) I am considering.
```

## Components

Available in `.mdx` files with no import. Leave a blank line after an opening tag and before a
closing tag. There are eight, listed here in full.

`Lead` takes no props. It is an intro paragraph.

```mdx
<Lead>
I help public-sector teams make technology decisions they can live with.
</Lead>
```

`CallToAction` is a button link. `label` and `href` are required; the message is optional.

```mdx
<CallToAction label="Get in touch" href="/contact/">

Have a question about a project?

</CallToAction>
```

`Figure`, `WideImage` and `FullImage` hold one image each: in the text column, a little wider,
and the full page width. `caption` is optional. The image needs alt text.

```mdx
<Figure caption="Speaking at a 2025 conference">

![Don Coleman on stage, gesturing toward a slide](./images/stage.jpg)

</Figure>

<WideImage>

![A whiteboard of a service map](./images/service-map.jpg)

</WideImage>

<FullImage caption="Optional caption">

![A wide landscape photo](./images/landscape.jpg)

</FullImage>
```

`SideImage` is a short passage of text with one small image beside it, as a tile on the left
with the text centred beside it. It takes no props and needs both the image (with alt text) and
some text.

```mdx
<SideImage>

![A conference badge](./images/badge.png)

Speaker at the 2025 health leadership conference.

</SideImage>
```

`ContactForm` is the contact form. It takes no props and no content.

```mdx
<ContactForm />
```

`RecentWriting` lists the newest posts. It takes no props and no content.

```mdx
<RecentWriting />
```

## Build errors you may see

The build stops at the first problem and names the file. Messages start with `Page file` or
`Page files`.

- Missing `title` or `description`, a wrong type (for example `position: "second"`), or a
  misspelled key: fix the top of the file.
- An image with no `alt`, an empty `alt`, or a file that does not exist: add the text or fix
  the path.
- A page with no content.
- An unknown component (for example `<Callout>`); the message lists the valid ones.
- A component missing something it needs, such as `CallToAction` without `href`, or an image
  component with no image.
- A `# Heading` in the body: use `##`.
- Two files with the same address (`about.md` and `about.mdx`), or an address that another
  route or a later feature reserves.
- Two menu entries with the same `position`.
- A file or folder name with anything other than lower-case letters, digits and hyphens.
