# Contract: content card DOM and CSS (050)

Supersedes the `#content-section` class list in `specs/003-standalone-pages/contracts/page-dom.md`
for both the standard page and the not-found page. Everything else in that contract is unchanged.

## Component

`src/components/page/ContentCard.astro`: no props, one default slot.

```html
<section
  id="content-section"
  class="prose lg:prose-lg dark:prose-invert prose-accent mx-auto mb-8 max-w-screen-lg
         rounded-2xl border border-dusk-200/80 bg-white p-4 shadow-xs sm:p-6 md:p-8
         dark:border-dusk-700/80 dark:bg-dusk-800">
  <slot />
</section>
```

## Callers

- `src/layouts/PageLayout.astro`: replaces the inline `<section id="content-section">`. The draft
  notice stays the first child: `<ContentCard>{draft && <DraftNotice />}<slot /></ContentCard>`.
  The title section, `HomeIntro` and feature image above it are unchanged (FR-007).
- `src/pages/404.astro`: replaces its inline `<section>`; the `<h1>` and copy move into the slot
  unchanged. The not-found page now also has `id="content-section"` (one per page).

## Invariants (tested)

1. The `#content-section` class list on the not-found page equals the one `PageLayout` renders
   (component test, FR-006).
2. No box-affecting utility (`rounded*`, `border` width, `p*`, `max-w*`, `m*`) carries a `dark:`
   variant. Proven behaviourally by the geometry spec (identical boxes in both themes), not by a
   class-string test.
3. At 390, 640, 768 and 1280 px, on `/about/` and `/nope/`, for both themes:
   - card `getBoundingClientRect()` x, y, width, height equal across themes (0 px);
   - computed `padding-left/right/top/bottom` = 16 px (390), 24 px (640), 32 px (768, 1280);
   - first `<p>` inside the card: same x and width across themes;
   - light mode: `border-top-width` ≥ 1 px and `box-shadow` ≠ `none`.
4. Colours per theme (theme-tokens probe on fixture `/sections/`):
   `background-color` [`white`, `dusk-800`]; `border-top-color` [`dusk-200/80`, `dusk-700/80`].
