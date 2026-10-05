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
| `src/content/pages/services/pricing.mdx` | `/services/pricing/` |
| `src/content/pages/services/index.mdx` | `/services/` |

Use lower-case letters, digits and hyphens only. Use `.mdx` when you want the sections below;
plain `.md` works for text only. Put images next to the page in `src/content/pages/images/`.

## The top of the file

```yaml
---
title: Services
description: The kinds of work Don Coleman takes on and how he works.
nav:
  position: 2
  label: Services
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
| `draft` | no | `true` shows a "draft" notice on the page. It does not hide the page from search or the sitemap. |
| `intro` | no | Home page only: the introduction card (`photo`, `name`, `tagline`, `bio`, `cta`). |

Do not write a `# Heading` in the body; the title is the page's only main heading. Use `##`.

## Menu positions and taken addresses

Positions 4, 5 and 7 belong to Writing, Projects and Contact. Pick another number; a clash
stops the build. The addresses `/writing/` and `/projects/` belong to the Writing and Projects
pages, `/contact/` is `contact.mdx`, and any address another part of the site already uses
(such as `/404/`) is taken too; a page file at one of them stops the build.

## Sections

Available in `.mdx` files with no import. Leave a blank line after an opening tag and before a
closing tag.

`Lead`: an intro paragraph.

```mdx
<Lead>
I help public-sector teams make technology decisions they can live with.
</Lead>
```

`TextBlock`: a titled block of Markdown. `title` is required.

```mdx
<TextBlock title="How I work">

Short engagements, written advice, and no lock-in.

</TextBlock>
```

`Offerings` and `Offering`: a list of things offered. `Offerings` may have a `title`; each
`Offering` needs a `title` and a description, and may have an `href`.

```mdx
<Offerings title="What I offer">
  <Offering title="Architecture reviews" href="/services/#reviews">

  An outside view of a system before a big decision.

  </Offering>
</Offerings>
```

`CallToAction`: a button link. `label` and `href` are required; the message is optional.

```mdx
<CallToAction label="Get in touch" href="/contact/">

Have a question about a project?

</CallToAction>
```

`Figure`, `WideImage`, `FullImage`: one image each, in the text column, a little wider, and the
full page width. `caption` is optional. The image needs alt text.

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

## Build errors you may see

The build stops at the first problem and names the file. Messages start with `Page file` or
`Page files`.

- Missing `title` or `description`, a wrong type (for example `position: "second"`), or a
  misspelled key: fix the top of the file.
- An image with no `alt`, an empty `alt`, or a file that does not exist: add the text or fix
  the path.
- A page with no content.
- An unknown section (for example `<Callout>`); the message lists the valid ones.
- A section missing something it needs, such as `CallToAction` without `href`, or an image
  section with no image.
- A `# Heading` in the body: use `##`.
- Two files with the same address (`about.md` and `about.mdx`), or an address that another
  route or a later feature reserves.
- Two menu entries with the same `position`.
- A file or folder name with anything other than lower-case letters, digits and hyphens.
