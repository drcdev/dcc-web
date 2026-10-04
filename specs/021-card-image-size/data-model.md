# Data Model: Right-size listing card images

**Feature**: `021-card-image-size` | **Spec**: [spec.md](./spec.md)

No content schema, collection or stored data changes. The post's `featureImage` frontmatter
(`src`, `alt`, `caption`) is unchanged, and the source image files are unchanged (spec, Out of
Scope). The one entity is how a card renders that image.

## Post card image (rendered)

The `<img>` that `src/components/post/PostCard.astro` renders through `<Image>` from
`astro:assets` when `post.featureImage` is set.

| Attribute | Today | After this feature | Requirement |
|---|---|---|---|
| Width candidates (`srcset`) | 320w, 480w, 640w | 320w, 400w, 640w | FR-001, FR-004 |
| Candidates for a source narrower than 640 px | widths ≤ source, plus the source width | same rule (Astro's), e.g. a 480 px source gives 320w, 400w, 480w | Edge case: never enlarged |
| `sizes` | `(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw` | `(min-width: 1024px) 320px, (min-width: 640px) 45vw, calc(100vw - 2rem)` | FR-002 |
| Encoding quality | none set (sharp WebP default, 80) | 65 (`q=65` on every candidate) | FR-003, research R3 |
| Format | WebP | WebP | FR-005 |
| `alt` | `featureImage.alt` | unchanged | FR-005 |
| `width` / `height` | source intrinsic size | unchanged | FR-005 |
| `loading` / `decoding` | `lazy` / `async` | unchanged | FR-005 |
| Shape | `aspect-[16/9]` with `object-cover` | unchanged | FR-005 |

A post with no `featureImage` renders a text-only card with no `<img>`, as today.

## Images that do not change (FR-006)

| Component | Today's `widths` / `sizes` | Quality |
|---|---|---|
| `src/components/post/LeadStory.astro` | unchanged | default (no `quality` prop) |
| `src/components/post/PostHero.astro` | unchanged | default |
| `src/components/project/ProjectRow.astro`, `PartPicture.astro` | unchanged | default |
| `src/components/page/HomeIntro.astro`, `FeatureImage.astro` | unchanged | default |
