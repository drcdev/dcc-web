# Contract: decision document and screenshots

**Feature**: 005-blog-design-directions | FR-019 to FR-021, SC-005, SC-006 | Research R8, R10

## Files that merge to main

```text
docs/design/blog.md                                  the decision document
docs/design/blog/{a|b|c}-{landing|listing|post}-{phone|desktop}-{dark|light}.jpg   36 images
```

`docs/design/` is shared with the parallel portfolio feature (`docs/design/portfolio.md`);
this feature adds only `blog.md` and the `blog/` folder, so there is no file in common.

## docs/design/blog.md structure

```markdown
# Drift & Convergence: blog design directions

Short purpose paragraph: what this document is for, that the prototypes were on the preview
deployment of pull request #N, and that the pictures below show every direction after the
prototypes were removed.

## How to compare
Preview index URL (branch preview), what each direction's three screens are, and a one-table
overview (idea, featured posts, topic presentation, post address) of all three directions.

## Direction A: Front page
### Summary
### Preview
Links to the landing, listing, topic and post screens on the preview deployment.
### Pictures
Landing, listing, post: phone and desktop, dark and light (12 images, each with alt text).
### How topics are presented
### Proposed addresses
Table: landing, all posts, page N, topic, post. States that a post's address contains no topic,
so renaming, merging or splitting topics changes no post address.
### When no post is featured
### New colours or fonts
"None" or the named addition.
### Trade-offs
Bulleted strengths and costs (reading experience, how it ages as the post count grows, effort
to build, dependence on feature images, phone behaviour).

## Direction B: Timeline
(same sub-sections)

## Direction C: Topic hubs
(same sub-sections)

## Notes common to all directions
Syntax highlighting deferred to the blog build (CSP; research R4); addresses from the current
site are not redirected; feeds and search are out of scope.

## Decision

Chosen direction:

Notes:
```

## Rules

1. Every direction section has all eight sub-sections (SC-005).
2. Every image is referenced with relative paths (`blog/a-landing-phone-dark.jpg`) and has alt
   text naming the direction, screen, width and theme.
3. The `## Decision` section is the last section and contains exactly the two labels
   `Chosen direction:` and `Notes:` with nothing after either (FR-020). Agents never fill it.
4. Plain language, no hype (constitution, Development Workflow).
5. After the removal commit (research R10), preview links become plain text followed by
   "(removed after review; see the pictures)"; the pictures and descriptions alone must be
   enough to compare the directions (FR-021).

## Screenshot capture

- Config: `tests/design/playwright.config.ts` (standalone, like `tests/reference/`; not in
  `verify`). Web server: `wrangler dev --ip 127.0.0.1 --port 4321` over the production build.
- Spec: `tests/design/capture-blog.spec.ts`. For each direction, screen (landing = `/{d}/`,
  listing = `/{d}/all/`, post = the full-with-image post), width (390 × 844, 1280 × 800) and
  theme (set through `localStorage["color-theme"]` before load, as `visual.spec.ts` does), it
  waits for the theme class, disables animations, and saves a full-page JPEG (quality 80,
  clipped to 3 200 px tall) to `docs/design/blog/`.
- Run: `corepack pnpm run build`, then
  `corepack pnpm exec playwright test --config tests/design/playwright.config.ts`.
- Screenshots are captured on macOS Chromium; they are illustrations, not baselines, so there
  is no Linux counterpart and no pixel comparison.
- The config and spec are deleted in the removal commit; the images stay.
