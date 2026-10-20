# Quickstart: validate full-card click and hover feedback

Follow the Local toolchain section of `CLAUDE.md` (nvm, pnpm shim, no `timeout`) for every command.

## Automated

1. Component tests: `pnpm vitest run tests/component/post/PostCard.test.ts tests/component/post/LeadStory.test.ts`
   - Expect: one post link per card, marked `data-post-link`; movement classes all `motion-safe:`.
2. E2E on the fixture site: `pnpm playwright test tests/e2e/blog-fixtures.spec.ts`
   - Expect: image, summary, date and empty area hit the post link; pills and series marker open
     their own pages; keyboard focus outlines the card; hover lifts only with motion allowed and
     a hover pointer.
3. Forced colours: `pnpm playwright test tests/e2e/blog-forced-colors.spec.ts`
   - Expect: the focused card outline is `CanvasText`.
4. Unchanged templates: the `a11y` and `visual` Playwright projects pass with no baseline refresh.

## Manual (preview deployment)

- `/writing/`: hover the lead story and a card with a mouse (slight lift, shadow, image grows
  inside its frame); click the image, summary and blank space (post opens); click a pill (topic
  page opens).
- Tab through the page: the outline wraps the whole card; the card does not lift.
- Turn on Reduce motion in the OS: hover shows the shadow only, nothing moves.
- On a phone: tap a card's image (post opens); after going back, the card is not left lifted.
