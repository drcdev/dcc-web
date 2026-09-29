# Research: Standalone pages for doncoleman.ca

**Feature**: `003-standalone-pages` | **Date**: 2026-09-29 | **Plan**: [plan.md](./plan.md)

Every Astro decision below was checked against the official documentation through the Astro Docs
MCP server (`astro-docs`), which was available for this plan (Constitution Principle IV and the
"Astro decisions cite the docs" rule). The installed versions are Astro 7.3.5, Tailwind 4.3.3 and
`@astrojs/sitemap` 3.7.4 (`package.json`).

Each entry uses the format **Decision / Rationale / Alternatives considered**, plus the doc pages
that support it.

---

## R1. Page files: a build-time content collection with the `glob()` loader

**Decision**: Define one collection, `pages`, in `src/content.config.ts` with
`glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" })` and a Zod schema. Page files
live in `src/content/pages/`; the file name (and folder) gives the address.

**Rationale**: Content collections are Astro's first-party answer to "a folder of structurally
identical Markdown/MDX files validated by a schema". A schema violation fails `astro build` (and
`astro sync`/`astro check`) with an error that names the collection and the entry, which is what
FR-007 and Principle VI require. Build-time collections are prerendered, satisfying Principle V.

**Alternatives considered**:
- Markdown/MDX files directly in `src/pages/` with a `layout` frontmatter key: no schema
  validation of frontmatter, so FR-007 would need custom checks; rejected.
- Live collections: need on-demand rendering and do not support MDX; rejected (Principle V).
- Markdoc (`@astrojs/markdoc`): its tag attribute definitions would give section validation, but
  it is a second authoring syntax for Don and Claude Code to learn, and the Flux port and later
  blog work lean on MDX. Rejected in favour of MDX (R3).

**Docs**: docs.astro.build/en/guides/content-collections/#defining-build-time-content-collections;
…/content-collections/#the-glob-loader; …/content-collections/#defining-the-collection-schema;
…/content-collections/#types-of-collections.

## R2. Schema strictness, images and the "both or neither" rules

**Decision**:
- Use `z.strictObject(...)` at the top level and for every nested object, so an unknown or
  misspelled setting fails the build (FR-007, US5 scenario 2).
- Group paired settings into objects so "both or neither" is structural: `image: { src, alt }`,
  `featureImage: { src, alt, caption? }`, `nav: { position, label? }`. Present means "on";
  absent means "off" (`nav` absent = not in navigation, FR-004 default).
- Validate image paths with the schema's `image()` helper (`schema: ({ image }) => ...`), so a
  missing image file fails the build naming the entry (FR-007 "refers to an image that does not
  exist"), and the result is `ImageMetadata` usable by `<Image />` and `getImage()`.
- Alt text is `z.string().trim().min(1)`, never optional.
- The schema lives in `src/content/schemas/page.ts` as a factory `pageSchema({ image })`, with
  shared building blocks in `src/content/schemas/shared.ts`, so unit tests can call it with a
  stand-in `image` validator and later collections (blog, projects) reuse the same pieces.

**Rationale**: Zod 4 is re-exported by `astro/zod`; the `image()` helper is the documented way to
validate and import images referenced from frontmatter. Note the docs' limitation:
`image().refine()` is unsupported, so no custom checks are chained on `image()` itself.

**Alternatives considered**: flat keys (`imageAlt`, `navLabel`, `navPosition`) with
`superRefine` cross-field checks: more code, worse error messages. Rejected.

**Docs**: docs.astro.build/en/guides/content-collections/#defining-datatypes-with-zod;
docs.astro.build/en/reference/modules/astro-zod/;
docs.astro.build/en/guides/images/#images-in-content-collections.

## R3. Reusable sections: MDX with components passed to `<Content />`

**Decision**: Add the official `@astrojs/mdx` integration (`pnpm astro add mdx`). Sections are
Astro components in `src/components/sections/`, exported from one registry
(`src/components/sections/index.ts`). The page route renders
`<Content components={sections} />`, so page files use `<Lead>`, `<CallToAction>` etc. **without
import statements**.

**Rationale**: The MDX guide documents passing custom components to a collection entry's
`<Content />` through the `components` prop. Not requiring imports keeps page files plain for Don
(US3) and makes the registry the single list of valid sections. Astro components ship no
client-side JavaScript (Principle V, FR-030).

**Alternatives considered**: per-file `import` statements (what the MDX guide shows first):
error-prone for Don, and an import path typo is a less clear error; rejected. Markdoc tags: see
R1.

**Docs**: docs.astro.build/en/guides/integrations-guide/mdx/#installation;
…/mdx/#using-local-mdx-with-content-collections; …/mdx/#passing-components-to-mdx-content;
docs.astro.build/en/basics/astro-components/.

## R4. Markdown processor: stay on Astro 7's default (Sätteri), no plugins

**Decision**: Do not configure `markdown.processor` and add no remark/rehype/Sätteri plugins.

**Rationale**: Astro 7 renders `.md` and `.mdx` with Sätteri by default; plugins require either
`@astrojs/markdown-satteri` or `@astrojs/markdown-remark` as a new dependency, and the Sätteri
plugin docs do not document build-failing errors or file access from a plugin. Section
validation (R7) does not need a plugin.

**Alternatives considered**: an mdast plugin that validates section tags and attributes during
compilation: the most precise option, but adds a dependency and relies on an undocumented error
path; rejected for now. If R7's checks prove too coarse, this is the documented next step.

**Docs**: docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-sätteri;
docs.astro.build/en/guides/markdown-content/#markdown-processors;
docs.astro.build/en/guides/integrations-guide/mdx/#processor.

## R5. Routing: one rest-parameter route generating every page

**Decision**: Replace `src/pages/index.astro` with `src/pages/[...slug].astro`. Its
`getStaticPaths()` calls `getCollection("pages")` and returns `{ params: { slug }, props: { entry } }`
with `slug: undefined` for the home entry (address `/`) and `"about"`, `"services"`,
`"legal/notice"` (nested) etc. for the rest. `trailingSlash: "always"` (existing config) gives the
trailing slash (FR-003).

- Entry ids come from a custom `generateId` passed to `glob()` that uses the pure
  `addressFromPath()` function (`src/lib/content/address.ts`): strip the extension, drop a final
  `/index`, and reject any path segment outside `[a-z0-9-]` with a `PageContentError` (spec
  FR-003). `index.mdx` maps to the id `index` and the address `/`.

**Rationale**: The content collections guide documents exactly this for static output, including
the rest parameter for multi-segment ids; the routing reference documents `undefined` for the
root of a rest route. One route file means adding a page needs no code change (FR-002).

**Alternatives considered**: a separate `src/pages/index.astro` for Home: duplicates the page
pipeline and makes Home a code change; rejected.

**Docs**: docs.astro.build/en/guides/content-collections/#generating-routes-from-content;
docs.astro.build/en/reference/routing-reference/#getstaticpaths;
docs.astro.build/en/reference/errors/get-static-paths-invalid-route-param/;
docs.astro.build/en/reference/content-loader-reference/#generateid.

## R6. Address conflicts (FR-008)

**Decision**: `getStaticPaths()` first runs `assertUniqueAddresses()` from
`src/lib/content/address.ts` over the **file list** from
`import.meta.glob("/src/content/pages/**/*.{md,mdx}")` (keys only, not the store), and over the
addresses of every other route file found with `import.meta.glob("/src/pages/**/*.{astro,ts,js,md,mdx}")`
(excluding `[...slug].astro`; dynamic segments reserve their static prefix), and against the
`futureDestinations` addresses reserved for later features (spec FR-008). It throws a
`PageContentError` naming both files.

**Rationale**: The content store keeps one entry per id, so two files that map to the same id
(`about.md` and `about.mdx`, or `about.mdx` and `about/index.mdx`) collapse before the route sees
them; only the file list shows both. Astro does not fail a build when a static route shadows a
dynamic one, so the check against `src/pages/` is needed for "already used by another part of
the site". `import.meta.glob` is the Vite feature Astro documents for file lists.

**Alternatives considered**: rely on the glob loader's duplicate-id warning: a warning, not a
failure; rejected. A custom loader wrapping `glob()`: more code for the same result; rejected.

**Docs**: docs.astro.build/en/guides/imports/#importmetaglob;
docs.astro.build/en/guides/routing/#route-priority-order.

## R7. Section validation with the file named (FR-007)

**Decision**: Two layers, both raising `PageContentError` (`src/lib/content/errors.ts`), whose
message is `Page file <path>: <problem in plain words>`.

1. **Body checks in the route** (`validatePageBody(entry)` in `src/lib/content/body.ts`, run in
   `getStaticPaths()` using `entry.body` and `entry.filePath`): empty body; any capitalised JSX tag
   outside code fences that is not in the section registry ("uses a section that does not
   exist"); Markdown images with empty alt text `![](…)`.
2. **Prop checks in each section**: every section validates its props with a Zod schema from
   `src/components/sections/schemas.ts` and, on failure, throws naming the section, the missing
   or invalid setting and the page file. The route puts the file path in `Astro.locals.pageFile`
   before rendering `<Content />` (typed in `src/env.d.ts`); sections fall back to
   `Astro.url.pathname` if it is absent.

**Rationale**: MDX's own "Expected component `X` to be defined" error does not name the file in a
production build; the route has `entry.filePath` and can say it clearly. Validation in the
component covers props given as expressions too. No Markdown plugin or new dependency (R4).

**Alternatives considered**: mdast plugin (R4); TypeScript-only prop types (not enforced for MDX
at build); rejected.

**Docs**: docs.astro.build/en/reference/modules/astro-content/#collectionentry (`body`,
`filePath`); docs.astro.build/en/reference/api-reference/#locals.

## R8. Images: `astro:assets` everywhere

**Decision**:
- Frontmatter images (feature image, sharing image, Home intro photo) use the schema `image()`
  helper and render with `<Image />` from `astro:assets` (explicit `widths`/`sizes` for the
  feature image, a fixed 512 px source for the 256 px intro photo).
- Sharing image URL: `getImage({ src, width: 1200, format: "png" })` in the route, rendered
  absolute by the existing `Seo.astro`; falls back to `/og-default.png` (FR-005).
- Section images (`<Figure>`, `<WideImage>`, `<FullImage>`) take a **standard Markdown image as
  their child** — `![alt](./images/x.jpg)` — which Astro optimises in MDX with no import. The
  component wraps it in `<figure>` with an optional `<figcaption>` (US4 scenario 4) and adds the
  width class. A section with no image child fails (R7 layer 2). A missing file fails Astro's
  image resolution.
- Page images live in `src/content/pages/images/`. Don's photo is committed there as
  `don-coleman.jpg` (copied from the current site in the implement phase).

**Rationale**: The images guide documents Markdown `![]()` syntax in MDX as optimised without an
import, and `image()` for frontmatter. Built-in handling beats hand-written `<img>` (Principle IV)
and keeps images inside the performance budget.

**Alternatives considered**: `src` string props resolved with `import.meta.glob`: custom code for
what Markdown syntax already does; kept as the fallback if an image inside a section's children
turns out not to be optimised (to be proven by the first section component test).

**Docs**: docs.astro.build/en/guides/images/#images-in-mdx-files;
…/images/#images-in-content-collections; docs.astro.build/en/reference/modules/astro-assets/#image-;
…/astro-assets/#getimage.

## R9. Wide and full-width images (port of `kg-width-wide` / `kg-width-full`)

**Decision**: Port the two classes into `src/styles/global.css`, keeping Flux's class names
(`kg-width-wide`, `kg-width-full`, and their centred `figcaption`), with two fixes:
- **Wide**: Flux's `md:-mx-[calc(12vw-2rem)]` overflows between the `lg` container and ~1150 px
  (the negative margin exceeds the free space beside the 1024 px column). Clamp it:
  `margin-inline: max(calc(-12vw + 2rem), calc(50% - 50cqw))`.
- **Full**: Flux relies on Ghost's `--kg-breakout-adjustment` (scrollbar width), which this site
  does not have, and `100vw` includes the scrollbar, causing horizontal scroll on desktop. Use a
  container query unit: make `body` an inline-size container (`container-type: inline-size`) and
  set `width: 100cqw; margin-inline: calc(50% - 50cqw)`, which excludes the scrollbar.
- Both collapse to the text column below `md` (phones), and the width is on the `<figure>`, so an
  image inside a list or narrow block cannot exceed the viewport (spec edge case).

**Rationale**: Pure CSS, no script; the design-system port is kept recognisable. Container query
units are Baseline widely available.

**Alternatives considered**: `overflow-x: clip` on `<main>` to hide the overflow: hides content
and still fails the reflow check's intent; rejected.

**Docs**: Tailwind arbitrary values (tailwindcss.com/docs/adding-custom-styles); no Astro API.

## R10. Navigation: page files opt in, merged with fixed entries

**Decision**: `src/config/navigation.ts` keeps the fixed entries for destinations owned by later
features — Writing (position 4), Projects (5), Contact (7) — now with a `position`. A pure
`mergeNavigation(fixed, fromPages)` in `src/lib/content/navigation.ts` sorts by position and
throws naming both sources on a duplicate position (FR-008, edge case). An async
`getPrimaryNavigation()` wraps it with `getCollection("pages")`; page entries use `nav.label ??
title` and the page address. Home (1), Services (2), Speaking (3) and About (6) launch with
`nav` set, so the rendered navigation is identical to the foundation's (FR-025).

`SiteHeader` receives `items` from `BaseLayout`; `BaseLayout` takes an optional `navigation` prop
and calls `getPrimaryNavigation()` when it is absent. Component tests pass the prop so they do not
depend on the content layer.

**Rationale**: Keeps the header static HTML; the navigation stays one ordered list. Only the
source of the primary items changes; the footer (`footerNavigation`) and social links are
unchanged (FR-026). `futureDestinations` shrinks to `/writing/`, `/projects/`, `/contact/`
(FR-027).

**Alternatives considered**: navigation stays a hand-kept list: contradicts the clarification
(page files opt in); rejected.

**Docs**: docs.astro.build/en/reference/modules/astro-content/#getcollection (order is
non-deterministic, so the merge sorts explicitly).

## R11. Search engines, drafts and the sitemap (FR-006, FR-015)

**Decision**: `@astrojs/sitemap` already lists every prerendered route except `/404`; the new
pages appear with no configuration change. Drafts render `DraftNotice` and are otherwise treated
like any other page: no page-level `noindex`. The foundation's **site-wide** pre-launch `noindex`
(`site.indexable: false` plus `X-Robots-Tag` in `public/_headers`) stays until the domain-switch
follow-up; it applies equally to every page, so a draft page is indexed exactly when a
non-draft page is. Tests assert the robots meta is identical for a draft and a non-draft page.

**Rationale**: Keeps FR-006's intent (drafts are not hidden) without undoing a foundation
decision that belongs to another follow-up.

**Docs**: docs.astro.build/en/guides/integrations-guide/sitemap/.

## R12. Home page: introduction card in frontmatter

**Decision**: The home page file (`src/content/pages/index.mdx`) sets an `intro` object: `photo`
(`src`, `alt`), `name`, `tagline`, `bio`, `cta` (`label`, `href`). When `intro` is present the
page layout renders `HomeIntro` (port of `layout-author-hero.hbs`) in place of the title heading:
the name is the page's `<h1>` (Flux uses an `<h2>`; the spec requires the name as the main
heading). The subscribe button becomes the `cta` link (to `/services/` at launch). Social links
come from `socialNavigation` with the footer's icons and accessible names (FR-016). Flux's
Website/X/Bluesky links and the link wrapping the photo and name to the author page are dropped
(no author pages). The home document title stays the site name (the route omits `title` for `/`,
as the foundation's home did).

A content test asserts the home body has no `<CallToAction>` (FR-019).

**Rationale**: FR-018 requires the card's text to be editable in the home page file; frontmatter
gives schema validation of every card field.

**Alternatives considered**: a `<HomeIntro>` section inside the MDX body: its props would only be
checked at render time, and it could be misused on other pages; rejected.

## R13. Colour contrast of ported classes

**Decision**: Where a ported Flux pairing fails WCAG 2.2 AA (axe in both themes), swap to the
nearest passing shade of the same palette and record it in `docs/design-source.md` "Accessibility
adjustments", as the foundation did. Likely candidates, to be confirmed by the a11y tests:
the hero tagline (`text-mauve-400` on white; `dark:text-mauve-500` on `dusk-800`), the social
icons (`text-dusk-400` on white), and the CTA (`bg-rust-500` with white text).

## R14. Test harness for build failures and the section fixture page

**Decision**: A helper, `tests/build/fixture-site.ts`, copies the project's `src/`, `public/`,
`setup/config.json`, `astro.config.mjs`, `tsconfig.json` and `package.json` into
`.cache/fixture-site/` (gitignored, inside the repo so `node_modules` resolves), drops chosen
fixture page files from `tests/fixtures/pages/` into its `src/content/pages/`, and runs Astro's
programmatic `build()` (or `sync()` for frontmatter-only cases, which is faster).

- **Build-failure tests** (`tests/build/page-validation.test.ts`, Vitest, long timeout): one
  broken fixture per rule in FR-007/FR-008; assert the build rejects and the message names the
  file and the problem (SC-003).
- **One-file page test** (SC-002): add `tests/fixtures/pages/workshops.mdx` only; assert
  `dist/workshops/index.html`, its metadata and its sitemap entry exist, and navigation is
  unchanged.
- **Section fixture site**: `pnpm run build:fixtures` builds the fixture site with
  `tests/fixtures/pages/sections.mdx` (every section once, with test images) to
  `.cache/fixture-site/dist`. A new Playwright project, `sections`, runs a11y, no-horizontal-scroll
  (320/390/1100/1280 px), no-JS and visual checks against it, served by a second Playwright
  `webServer` (`pnpm run build:fixtures && astro preview --root .cache/fixture-site --port 4322`, so
  every Playwright run builds it first; its visual shots live in the `visual` project). The fixture page is
  never part of the real site, so no test page is published or indexed.

**Rationale**: Proves the real Astro build fails, not just the schema; keeps test content out of
production. No new dependency: `astro` exposes `build()`, `sync()` and `preview`.

**Alternatives considered**: publishing a `/sections/` style page on the real site: it would be
indexed and listed in the sitemap (FR-006); rejected. Environment-conditional content in the
real build: the tested build would differ from production; rejected.

**Risk**: the programmatic API is documented as experimental; its signature may change in a minor release. It is used only by tests, pinned with Astro in the lockfile, and an Astro upgrade that breaks it shows up as a failing test, not a broken site.

**Docs**: docs.astro.build/en/reference/programmatic-reference/ (`build()`, `sync()`);
docs.astro.build/en/reference/cli-reference/#astro-preview; playwright.dev/docs/test-webserver
(multiple web servers).

## R15. Component tests with MDX

**Decision**: Component tests keep using the Container API with Vitest (`getViteConfig`). Tests
that render MDX (sections inside `tests/fixtures/pages/*.mdx`) load the MDX renderer with
`loadRenderers([getContainerRenderer()])` from `@astrojs/mdx/container-renderer` and
`astro:container`.

**Docs**: docs.astro.build/en/reference/container-reference/#renderers-option;
docs.astro.build/en/guides/testing/#vitest-and-container-api.

## R16. Carried-over copy

**Decision**: The implement phase fetches https://www.doncoleman.ca/terms-of-use/,
/technology/, /privacy-policy/ and /cookie-policy/ and adapts them (FR-022, FR-023): Ghost,
member accounts, subscriptions, comments, Supabase/Web3Forms and the old blog categories removed
or corrected; the privacy policy says no cookies, Cloudflare Web Analytics without cookies, and
the contact form's fields and retention period as draft placeholders (spec Assumptions). Don's
photo is downloaded from the current home page's author image. All seven pages launch with
`draft: true`.
