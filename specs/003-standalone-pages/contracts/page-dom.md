# Contract: page DOM

Extends the foundation's shell contract (`specs/002-site-foundation/contracts/shell-dom.md`):
header, skip link, `<main id="main">` and footer are unchanged. This covers what renders inside
`<main>`. Component tests (Container API) and E2E tests assert these structures.

## Standard page (`PageLayout`, port of `page.hbs` + `content-section.hbs`)

```html
<article class="mx-auto">
  <!-- title block (Flux page.hbs, without the share bar: owned by the Blog feature) -->
  <section class="mx-auto max-w-screen-lg mb-8">
    <h1 class="text-5xl font-bold text-dusk-900 dark:text-white my-4">{title}</h1>
  </section>
  <!-- only when featureImage is set; no element at all otherwise (US4 scenario 6) -->
  <section class="mx-auto max-w-screen-lg mb-8">
    <figure><img alt="{featureImage.alt}" …><figcaption>{caption}</figcaption></figure>
  </section>
  <!-- content-section.hbs -->
  <section id="content-section"
    class="mx-auto max-w-screen-lg prose lg:prose-lg dark:prose-invert prose-accent mb-8 dark:bg-dusk-800 dark:rounded-2xl dark:p-6">
    <!-- only when draft: true (FR-015) -->
    <p class="not-prose …" data-draft-notice>
      <strong>Draft.</strong> This page is a placeholder and will change.
    </p>
    {rendered MDX content}
  </section>
</article>
```

Heading rules: exactly one `<h1>`; content headings start at `<h2>`; a Markdown `# Heading` in a
page body is not allowed (body check fails the build: "use ## for headings; the page title is the
main heading"), which guarantees FR-014.

## Home page (`intro` set)

The title block is replaced by `HomeIntro` (port of `layout-author-hero.hbs`), placed first in
`<main>`:

```html
<section class="mx-auto max-w-screen-lg mb-8" aria-labelledby="intro-name">
  <div class="p-[2px] rounded-xl bg-gradient-to-br from-rust-400 via-sage-400 to-lavender-400 shadow-lg …">
    <div class="flex flex-col sm:flex-row rounded-xl overflow-hidden bg-white dark:bg-dusk-800">
      <img class="w-full aspect-square sm:aspect-auto sm:h-full object-cover shrink-0 sm:w-48 md:w-64"
           alt="{intro.photo.alt}" loading="eager" fetchpriority="high" width height …>
      <div class="flex flex-col items-center sm:items-start justify-center text-center sm:text-left p-6 flex-1">
        <h1 id="intro-name" class="text-xl sm:text-2xl font-bold text-dusk-900 dark:text-white">{intro.name}</h1>
        <p class="mt-1 text-xs sm:text-sm italic …">{intro.tagline}</p>
        <p class="mt-3 text-sm sm:text-base leading-relaxed …">{intro.bio}</p>
        <div class="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
          <ul class="flex items-center gap-3"><!-- socialNavigation: same icons + sr-only names as footer --></ul>
          <a href="{intro.cta.href}" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg …">{intro.cta.label}</a>
        </div>
      </div>
    </div>
  </div>
</section>
```

Changes from Flux, all intentional: `<h2>` → `<h1>` (the name is the main heading); the photo
and name are no longer links to an author page; Website, X and Bluesky links dropped (the site
lists GitHub and LinkedIn only); the Subscribe button and its mail icon replaced by the `cta`
link; `hover:shadow-xl`/`transition-*` become `motion-safe:` variants; colour classes may move to
the nearest passing shade (research R13). The rest of the home body renders in the standard
content section below the card. The CTA is the page's only element styled as a primary button
(FR-019).
