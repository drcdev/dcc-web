# Contract: Post card image

**Feature**: `021-card-image-size` | Extends `specs/008-blog/contracts/blog-pages.md` "Post card".

Everything in the 008 "Post card" contract stays. This contract adds the rows below for the
card's `<img>` when the post has a feature image. Row ids are cited in test titles or comments.

| Row | Rule | Observed by |
|---|---|---|
| C1 | The `srcset` offers exactly the `w` descriptors 320w, 400w and 640w for a source at least 640 px wide; for a narrower source, Astro's rule applies (widths above the source dropped, the source width added), so nothing is enlarged. | Component: `PostCard.test.ts` |
| C2 | `sizes` is exactly `(min-width: 1024px) 320px, (min-width: 640px) 45vw, calc(100vw - 2rem)`. | Component: `PostCard.test.ts` |
| C3 | Every candidate (the `src` and each `srcset` URL) is encoded at quality 65 (`q=65`) and in WebP (`f=webp`). | Component: `PostCard.test.ts` |
| C4 | `alt`, `width`, `height`, `loading="lazy"` and the `aspect-[16/9] object-cover` classes are as before. | Component: `PostCard.test.ts` (existing assertions) |
| C5 | No other image component sets a quality: the lead story and post hero candidates carry no `q=` parameter. | Component: `LeadStory.test.ts`, `PostHero.test.ts` |
| C6 | At a 390×844 viewport, 1x, on every fixture-site page that shows image cards (`/`, `/writing/`, `/writing/all/`, `/writing/topics/fixture-cards/`, `/writing/drift/`), each card image's chosen candidate (`currentSrc`) has a descriptor of at most 400w. | E2E: `blog-fixtures.spec.ts` (`sections` project) |
| C7 | Every budget template and the 12-card fixture `/writing/all/` stay within 150 KB total transfer and the other budget limits. | Budget: `budget.spec.ts` (unchanged) |
