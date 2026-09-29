# Contract: reusable sections

Sections are Astro components in `src/components/sections/`, available in every `.mdx` page file
**without an import**. The set is closed: any other capitalised tag fails the build. Each renders
static HTML, meets WCAG 2.2 AA in both themes, and causes no horizontal scrolling from 320 px up
(FR-010, FR-011). The same examples go into `docs/pages.md` for Don (FR-012).

Leave a blank line after an opening tag and before a closing tag so the content inside is read
as Markdown.

## Lead

```mdx
<Lead>
I help public-sector teams make technology decisions they can live with.
</Lead>
```

Renders `<p class="lead">` (Tailwind Typography's lead style: larger, `--tw-prose-lead` colour).
Fails without text.

## TextBlock

```mdx
<TextBlock title="How I work">

Short engagements, written advice, and no lock-in.

</TextBlock>
```

Renders `<section aria-labelledby>` with an `<h2>` title and the Markdown body. Fails without
`title` or body.

## Offerings and Offering

```mdx
<Offerings title="What I offer">
  <Offering title="Architecture reviews" href="/services/#reviews">

  An outside view of a system before a big decision.

  </Offering>
  <Offering title="Advisory retainers">

  A few hours a month for a leadership team.

  </Offering>
</Offerings>
```

Renders an optional `<h2>` then a `<ul>` with one `<li>` per offering, in source order; each item
has a title (a link when `href` is set) and its description (US4 scenario 2). The item title is
an `<h3>` when `Offerings` has a `title` and an `<h2>` when it does not, so heading levels never
skip (spec FR-010). Fails when
an `Offering` has no `title` or description, or `Offerings` has no `Offering`.

## CallToAction

```mdx
<CallToAction label="Get in touch" href="/contact/">

Have a question about a project?

</CallToAction>
```

Renders an optional message and one prominent link styled as a button, with a visible focus ring
(US4 scenario 3). `href` must be `/…` or `https://…`. Fails without `label` or `href`. Not used in
the home page body (FR-019).

## Figure, WideImage, FullImage

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

Each renders `<figure>` around the optimised image with `<figcaption>` when `caption` is set
(US4 scenario 4). `WideImage` adds `kg-width-wide` (beyond the text column from `md` up);
`FullImage` adds `kg-width-full` (full window width, scrollbar excluded); both fit the screen on
phones (US4 scenario 5). Fails when there is no image inside, when the image has no alt text, or
when the image file does not exist.
