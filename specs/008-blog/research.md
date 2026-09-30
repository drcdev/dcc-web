# Research: The blog ("Drift & Convergence")

Phase 0 output for [plan.md](./plan.md). Every Astro choice cites the Astro documentation page
found through the Astro Docs MCP server (`astro-docs`), which was available for this plan
(Constitution Principle IV, Development Workflow). No item is left as NEEDS CLARIFICATION.

Versions in the repository at planning time: `astro` 7.3.5, `@astrojs/mdx` 8.0.2,
`@astrojs/markdown-satteri` 0.4.2 (Sätteri 0.10.5 underneath), Shiki 4.4.3 (via Astro),
`@astrojs/sitemap` 3.7.4, Tailwind 4.3.3, Playwright 1.63.0, Vitest 5.0.2.

---

## R1. Posts as a content collection

**Decision**: add a `posts` collection to `src/content.config.ts` with the built-in `glob()`
loader over `src/content/posts/`, pattern `*.{md,mdx}` (top level only; `images/` beside the
files holds pictures). A custom `generateId` calls a pure `slugFromPostPath()` in
`src/lib/content/post-address.ts` and the existing `assertFrontmatterImagesExist()`
(`src/lib/content/images.ts`), exactly as the `pages` collection does. The schema is
`postSchema({ image })` in a new `src/content/schemas/post.ts` beside `page.ts`, built from the
shared pieces in `src/content/schemas/shared.ts` (`captionedImage`, `requiredText`), with
`z.strictObject` so a misspelled setting fails the build.

- Posts must be `.mdx`. The code block and table components (R8, R9) replace the `pre` and
  `table` elements through MDX's `components` prop, which plain `.md` files do not support. A
  `.md` file in `src/content/posts/` fails the build with "rename it to .mdx" (contract
  build-errors row P13), rather than silently rendering without the copy button.
- Dates accept only a YAML date written `YYYY-MM-DD` (spec FR-031): `z.date()` on the value
  YAML parses, so a quoted string, a date with a time, `27/08/2026` or `next tuesday` fails
  with a message naming `date`. An impossible date such as `2026-02-30` must also fail; the
  first schema test establishes whether the YAML parser rejects it or silently rolls it over,
  and in the second case the post file check compares the raw frontmatter text with the parsed
  date. `updated` earlier than `date` fails through a `superRefine` on the
  object (FR-033); equal is allowed.
- Custom schema messages make both image description failures say "alt text" (FR-033), and the
  unknown-topic message lists the allowed ids in list order.
- Drafts are filtered at query time (R3), not by the loader, so the schema is identical in every
  environment and a broken draft still fails the build everywhere.

**Rationale**: the same structure feature 003 fixed for every later collection
(`docs/design-source.md` § Content structure); strict schemas give the file name and key in
Astro's own error (Principle VI).

**Alternatives considered**: a `file()` loader or a single JSON list of posts (breaks
"one file per post", SC-002); accepting `.md` and adding copy buttons with a hast plugin
(two code paths for one feature); rejected.

**Docs**: [Content collections — Build-time collection loaders](https://docs.astro.build/en/guides/content-collections/#build-time-collection-loaders);
[Defining the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema);
[Content loader reference — `generateId`](https://docs.astro.build/en/reference/content-loader-reference/#generateid);
[Images in content collections](https://docs.astro.build/en/guides/images/#images-in-content-collections);
[`astro/zod`](https://docs.astro.build/en/reference/modules/astro-zod/).

## R2. Topics as a controlled list

**Decision**: one typed module, `src/config/topics.ts`, exports `topics` (an ordered, `as const`
array of `{ id, name, description, colour }`) and `topicIds` (the tuple of ids). The post schema
uses `z.array(z.enum(topicIds)).min(1)` plus a uniqueness refinement, so a typo, a removed topic
or an empty list fails the build; Zod's enum message lists the allowed values, and a custom
`error` adds the file-oriented wording ("choose from: …"). The starting list and colours follow
the Direction A pictures and only existing palettes:

| id | name | colour palette |
|---|---|---|
| `compliant-data` | High-compliance data and integration | `rust` |
| `technology-teams` | High-performing technology teams | `sage` |
| `agentic-ai` | Agentic AI in legacy environments | `lavender` |
| `healthcare-leadership` | Healthcare technology leadership | `mist` |

Tailwind needs whole class names in source, so the pill, border and banner classes for each
palette live in one static map in `src/components/post/topic-styles.ts`
(`{ rust: { pill: "bg-rust-100 text-rust-900 dark:bg-rust-900 dark:text-rust-100", border: …,
banner: … } }`), keyed by the `colour` value; a unit test asserts every topic's colour has an
entry and that no two topics share a colour (FR-017). Contrast is proven by axe in both themes
(R16).

**Rationale**: FR-016 requires one list in one place, with the identifier used in the topic
address; `z.enum` turns it into a build-time check with no extra code.

**Alternatives considered**: a `topics` data collection (a `file()` loader over YAML) with
`reference()` from posts: first-party and it would also fail on unknown ids, but colours need the
static class map in code anyway, and the enum gives a clearer message listing every allowed
topic; rejected as more moving parts for the same guarantee.

**Docs**: [Defining datatypes with Zod](https://docs.astro.build/en/guides/content-collections/#defining-datatypes-with-zod);
[Styling — Tailwind](https://docs.astro.build/en/guides/styling/#tailwind).

## R3. Drafts: production versus preview, development and test builds

**Decision**: production is exactly "a Cloudflare Workers Builds build of `main`":
`WORKERS_CI === "1"` and `WORKERS_CI_BRANCH === "main"`. That is the same signal
`resolveSiteOrigin()` (`src/lib/site-origin.ts`) and `scripts/deploy/preview.ts` already use to
tell the `main` deploy (`wrangler deploy`) from branch previews (`wrangler versions upload
--preview-alias`). Every other build (branch previews, `astro dev`, local `astro build`, the
GitHub Actions `verify` run, the Playwright servers and the fixture-site builds) includes drafts.

- A pure function `includeDrafts(env)` in a new `src/lib/build-mode.ts` holds the rule and is
  unit-tested for each environment. Fail-safe (spec FR-046): when `WORKERS_CI === "1"` but
  `WORKERS_CI_BRANCH` is missing or empty, the build cannot tell production from preview and
  treats itself as production (drafts left out). Drafts are included only for a non-Workers
  build or a Workers Builds build of a named branch other than `main`.
- Draft post pages pass `noindex` to `Seo.astro` on every build (FR-045), independent of
  `site.indexable`.
- The two variables reach page code through Astro's typed environment variables: `env.schema`
  in `astro.config.mjs` declares `WORKERS_CI` and `WORKERS_CI_BRANCH` as
  `envField.string({ context: "server", access: "public", optional: true })`, read in
  `src/lib/posts.ts` from `astro:env/server`. Public server variables are fixed at build time in
  static output, and `getSecret()`/`process.env` are the documented fallbacks if a test harness
  needs to override them.
- `getPosts()` in `src/lib/posts.ts` is the only reader of the collection. It applies the
  filter `includeDrafts(env) || !data.draft` (the documented `getCollection()` filter pattern),
  so every page, listing, topic page, related list, home section and the sitemap (which only
  lists built pages) follow one rule. The feed filters `!data.draft` **always** (US6 scenario 3:
  drafts never appear in the feed, even on preview).
- Draft post pages show the existing `DraftNotice` component with post wording ("Draft. This
  post is a draft and is not on the live site."), at the start of the title card (FR-032);
  draft cards show a "Draft" label beside the Featured mark in the same colours (FR-011).

**Rationale**: `import.meta.env.PROD` is true for every `astro build`, including preview
deploys and the CI test build, so the documented `PROD` example would hide the sample drafts on
the preview Don checks (clarification 1) and break every blog E2E test. The Workers Builds
variables are already trusted by the site-origin contract and its build-env test.

**Alternatives considered**: `--mode preview` on branch builds (needs a change to the Workers
Builds build command in the dashboard, which Principle VIII forbids doing by hand, and a missed
flag would publish drafts); a `PUBLIC_INCLUDE_DRAFTS` variable set per environment (a second
source of truth that can drift from the deploy rule); rejected.

**Risk**: a production build made outside Workers Builds would include drafts. Production is
deployed only by Workers Builds from `main` (Principle II, feature 002), and
`tests/unit/site/build-env.test.ts` gains assertions that the main-branch build contains no
draft page, feed item or sitemap entry.

**Docs**: [Type safe environment variables](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables);
[Configuration reference — `env.schema`](https://docs.astro.build/en/reference/configuration-reference/#env);
[Filtering collection queries](https://docs.astro.build/en/guides/content-collections/#filtering-collection-queries);
[Environment variables — In the Astro config file](https://docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file).

## R4. Routes, addresses and pagination

**Decision**: four route files under `src/pages/writing/` plus the feed:

| File | Addresses |
|---|---|
| `writing/index.astro` | `/writing/` |
| `writing/all/[...page].astro` | `/writing/all/`, `/writing/all/2/` … |
| `writing/topics/[topic]/[...page].astro` | `/writing/topics/{topic}/`, `/writing/topics/{topic}/2/` … |
| `writing/[slug].astro` | `/writing/{slug}/` |
| `writing/rss.xml.ts` | `/writing/rss.xml` |

- Listings use `paginate()` with `pageSize: 12` (a constant in `src/config/blog.ts`). The rest
  parameter `[...page]` makes page 1 the bare address, so `/writing/all/1/` is never built and
  falls to the not-found page (`wrangler.jsonc` `not_found_handling: "404-page"`), as the spec's
  edge case requires. The `format` option (Astro ≥ 7.1) appends the trailing slash the site uses
  (`trailingSlash: "always"`).
- Topic pages use nested pagination: one `paginate()` call per topic in the controlled list with
  `params: { topic }`. A topic with no posts still needs its page (FR-014, US4 scenario 5); if
  `paginate([])` yields no path, the route adds a single empty page for that topic itself. A
  build test covers the empty topic.
- Static segments (`all`, `topics`) outrank `[slug]` in Astro's route priority, and the slugs
  `all` and `topics` are reserved anyway (FR-003, R1).
- The page-address check in `src/pages/[...slug].astro` already treats `writing/[slug].astro` as
  claiming every address under `/writing/`, so a page file can never collide with a post.
  `"/writing/"` is removed from `futureDestinations` in `src/config/navigation.ts` because the
  landing route now claims it.

**Rationale**: Astro's built-in pagination gives `page.url.prev/next/first/last`,
`currentPage` and `lastPage`, which is all the numbered page links need (FR-012).

**Docs**: [Routing — Pagination](https://docs.astro.build/en/guides/routing/#pagination);
[Nested pagination](https://docs.astro.build/en/guides/routing/#nested-pagination);
[Routing reference — `paginate()`](https://docs.astro.build/en/reference/routing-reference/#paginate);
[Route priority order](https://docs.astro.build/en/guides/routing/#route-priority-order);
[Generating routes from content](https://docs.astro.build/en/guides/content-collections/#generating-routes-from-content).

## R5. Ordering, landing selection and related posts

**Decision**: pure functions over plain post summaries in `src/lib/content/post-order.ts`,
unit-tested without Astro:

- `sortNewestFirst`: `date` descending, then `title` ascending (`localeCompare` with `"en"` and
  `sensitivity: "base"`), then `slug` ascending, so equal dates are stable between builds
  (FR-015).
- `selectLanding(posts)`: `lead` = first; `featured` = up to 3 featured posts other than the lead,
  most recent first; `latest` = up to 6 of the rest not already shown. One post gives only a
  lead; no featured posts leaves `featured` empty and the grid out (FR-006–FR-009, edge cases).
- `selectRelated(post, posts)`: other posts ranked by number of shared topics, then newest; when
  none share a topic, the newest other posts; at most 3; empty when there are no others
  (FR-029).
- `selectRecent(posts)`: the 3 newest (FR-038).

Counts live in `src/config/blog.ts` (`pageSize: 12`, `featuredMax: 3`, `latestMax: 6`,
`recentMax: 3`, `relatedMax: 3`) with the section name "Drift & Convergence" and the
"views are my own" wording (FR-027: one place).

**Rationale**: the rules are the heart of US2 and US5 and are cheapest to prove as unit tests.

## R6. Reading time at build time (Sätteri mdast plugin)

**Decision**: follow Astro's "Add reading time" recipe for the Sätteri processor. A plugin made
with `defineMdastPlugin` (`src/lib/markdown/reading-time.ts`) runs `context.textContent(root)`
and stores `minutesRead` (a whole number) on `context.data.astro.frontmatter`. Because
`textContent` does not include attribute values, the plugin also adds the text of each code
fence's `caption="…"` meta and each section's `caption` attribute, so the count matches spec
FR-021 (captions counted; language names, tag names and other markup not). The count is done
by a pure `readingMinutes(text)` in the same folder: words split on whitespace, 225 words a
minute, rounded up, at least 1 (FR-021, edge case "very short post"). It is registered with
`markdown: { processor: satteri({ mdastPlugins: [readingTime] }) }` in `astro.config.mjs`; MDX
inherits it (`extendMarkdownConfig` defaults to true). Routes read it from
`remarkPluginFrontmatter` returned by `render(entry)`; `src/lib/posts.ts` renders each post
once per build and caches the summary, so cards on listings get the same number as the post
page.

- The recipe's `reading-time` package is **not** added: its only job here is a word count, and
  a ten-line tested function avoids a dependency.
- `satteri` becomes a direct dependency, pinned to the version `@astrojs/markdown-satteri`
  already installs (0.10.5), because pnpm does not let the config import a transitive package.
  `@astrojs/markdown-satteri` is already a direct dependency.
- Feature 003 (research R4) chose "no Markdown plugins" for pages; this plan adds the first
  plugin, which also sets `minutesRead` on pages (unused there, harmless).

**Alternatives considered**: computing from `entry.body` without a plugin (counts MDX tags and
code fence syntax as words, and the direction asks for a build-time plugin); switching to the
`unified()` processor for the remark recipe (adds `@astrojs/markdown-remark` and leaves Astro 7's
default pipeline); rejected.

**Docs**: [Recipes — Add reading time](https://docs.astro.build/en/recipes/reading-time/);
[Markdown processors](https://docs.astro.build/en/guides/markdown-content/#markdown-processors);
[Modifying frontmatter programmatically](https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically);
[MDX — `extendMarkdownConfig`](https://docs.astro.build/en/guides/integrations-guide/mdx/#extendmarkdownconfig);
[`render()` — `remarkPluginFrontmatter`](https://docs.astro.build/en/reference/modules/astro-content/#render).

## R7. Syntax highlighting and the content security policy

**Finding**: the site's policy is Astro's `security.csp` meta tag with
`styleDirective.resources: ["'self'"]` plus Astro's generated hashes for `<style>` elements
(`astro.config.mjs`; feature 002 research R8). There is no `'unsafe-inline'` for styles, and
hashes cannot cover `style=""` attributes. Astro's Shiki output is "limited to inline `style`s":
the `pre` carries `background-color`, `color` and (added by Astro) `overflow-x: auto`, and every
token `span` carries `color` (or `--shiki-light`/`--shiki-dark` variables with dual themes, which
are still `style` attributes). The `css-variables` theme also emits `style` attributes. So every
highlighted block would raise CSP violations and render unstyled.

**Decision**: keep the CSP exactly as it is, and make Shiki emit classes instead of styles:

1. **One "semantic" Shiki theme**, `src/lib/markdown/shiki-theme.ts`, set with
   `markdown.shikiConfig.theme`. Each token category (comment, keyword, string, number and
   constant, function, type, variable and property, tag, attribute, punctuation and operator,
   plus default text and background) gets a unique placeholder colour. The theme carries no
   `fontStyle`.
2. **A Shiki transformer**, `src/lib/markdown/shiki-classes.ts`, passed through
   `markdown.shikiConfig.transformers` (Astro runs its own `pre` transformer first, then the
   user's). Its `span` hook replaces each placeholder colour with a class (`hl-keyword`, …); its
   `pre` hook deletes the `style` attribute (overflow moves to CSS) and reads a `caption="…"`
   value from the fence's meta string into `data-caption` (R8); a final `root` hook walks the
   tree and throws if any `style` attribute survives or a colour is not in the map, naming the
   colour. A build therefore cannot ship a style attribute by accident.
3. **Colours in CSS**: `src/styles/global.css` gains a code block after the existing rules:
   `.astro-code` background, text and each `hl-*` colour from existing palette tokens, with
   `.dark` variants (the site's class-based `@custom-variant dark`). Light and dark themes are
   therefore "matched to the palette" by construction and switch with the site's theme toggle,
   with no `!important` overrides. The Flux Prism colours (`screen.css`) are the starting
   pairing; any pair axe reports under 4.5:1 moves to the nearest passing shade and is logged
   in `docs/design-source.md` § Accessibility adjustments, as feature 002 did.

Code without a language goes through Shiki as `plaintext` and gets only the default-text class,
so it sits in the same box with the same copy button (edge case). Shiki's `pre` already has
`tabindex="0"`, which keeps a scrolling block keyboard reachable (axe
`scrollable-region-focusable`).

**Rationale**: the first-party highlighter stays in use, the policy stays strict, and the
guarantee is enforced at build time. E2E tests also listen for CSP violations on post pages
(`tests/e2e/csp-violations.ts`) and assert no `[style]` inside `.astro-code`.

**Alternatives considered** (Principle IV: the first-party options, and why each falls short):

- **`styleDirective.resources: [{ resource: "'unsafe-inline'", kind: "attribute" }]`** (Astro
  ≥ 7.1; the docs name Shiki as the common use; feature 002 R8 recorded it as the forward
  note). First-party and one line, but it loosens the policy on every page of the site to
  accept any injected `style` attribute, reversing R8's removal of `'unsafe-inline'`, and Astro
  warns when `"default"` and `"attribute"` sources are mixed, which forces the existing
  `'self'` to be re-scoped too. Rejected for a policy change that is not needed; it remains the
  fallback if a future Shiki version stops honouring the transformer.
- **`markdown.syntaxHighlight: "prism"`** (built in, class-based, no inline styles). Meets the
  CSP, but the design source and the feature direction name Shiki, Astro describes Prism as
  planned for extraction into a separate package, and Shiki's grammars are what Astro
  maintains; rejected, kept as the second fallback.
- **Shiki dual themes or the `css-variables` theme**: still `style` attributes; rejected.
- **`transformerStyleToClass` from `@shikijs/transformers`**: does the same job generically but
  adds a dependency and generates its CSS at run time, which Astro's Markdown pipeline gives no
  documented place to emit; rejected in favour of a fixed class list with CSS in `global.css`.
- **Expressive Code** (community integration): third-party, ships its own styles and scripts;
  rejected.

**Docs**: [Syntax highlighting — Markdown code blocks](https://docs.astro.build/en/guides/syntax-highlighting/#markdown-code-blocks);
[Adding your own Shiki theme](https://docs.astro.build/en/guides/syntax-highlighting/#adding-your-own-shiki-theme);
[Transformers](https://docs.astro.build/en/guides/syntax-highlighting/#transformers);
[Configuration reference — `markdown.shikiConfig`](https://docs.astro.build/en/reference/configuration-reference/#markdownshikiconfig);
[`security.csp.styleDirective.resources`](https://docs.astro.build/en/reference/configuration-reference/#securitycspstyledirectiveresources).

## R8. Code block component, caption and copy button (port of `kg-code-card`)

**Decision**: the post route passes `pre: CodeBlock` in `<Content components={...} />`. Astro's
Sätteri highlighter returns the highlighted `<pre>` as a hast element precisely so MDX
`components.pre` overrides still apply. `src/components/post/CodeBlock.astro` renders:

```text
<figure class="code-card" data-code-block>
  <div class="code-card__bar"> <copy-code> button (hidden without JS) + live region </div>
  <pre …Shiki's attributes…><slot /></pre>
  <figcaption>caption</figcaption>          (only when data-caption is present)
</figure>
```

- Caption: written on the fence, ```` ```ts caption="Reading a post's settings" ````. The
  transformer (R7) copies it to `data-caption`; no wrapper component is needed, and the body
  stays plain Markdown.
- Copy button: a `<button type="button">Copy code</button>` inside a `<copy-code>` custom
  element, defined in the component's `<script>` (Astro bundles it as a module, loaded after
  parse, and hashes or serves it from `'self'` under the CSP). It is `hidden` in the markup and
  shown by the `js:` variant (the pre-paint script adds `js` to `<html>`), so without scripts no
  button appears (FR-025, US1 scenario 5). The script copies `pre.textContent` exactly with
  `navigator.clipboard.writeText`, then writes "Copied" or "Copy failed. Select the code to copy
  it." into a visually hidden `role="status"` region and the button's visible text for two
  seconds; on failure the code stays selectable. This is the only script the post body needs.
- Styles port Flux's `.kg-code-card` rules into `global.css` with the same tokens
  (`bg-dusk-50 dark:bg-dusk-900`, bordered, rounded; caption `text-mauve-600
  dark:text-mauve-400`), and `pre { overflow-x: auto }` so long lines scroll inside the box
  (FR-024, SC-006).

**Rationale**: an Astro component with a bundled script is the documented way to add a small
piece of interactivity without a UI framework; a custom element keeps the behaviour scoped to
each block. No `client:*` framework island is needed, so no framework integration is added.

**Alternatives considered**: a React/Preact island with `client:visible` (adds a framework
dependency for one button); a script that finds every `pre` and injects buttons (works, but the
direction asks for a code block component with caption, and captions need markup at build
time); rejected.

**Docs**: [MDX — Assigning custom components to HTML elements](https://docs.astro.build/en/guides/integrations-guide/mdx/#using-components-in-mdx);
[Passing components to MDX content](https://docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content);
[Scripts and event handling — Web components with custom elements](https://docs.astro.build/en/guides/client-side-scripts/#web-components-with-custom-elements);
[Script processing](https://docs.astro.build/en/guides/client-side-scripts/#script-processing).

## R9. Tables that scroll sideways (replacing `table-wrapper.js`)

**Decision**: the post route also passes `table: ScrollTable`.
`src/components/post/ScrollTable.astro` renders
`<div class="table-wrapper" role="region" aria-label="Table" tabindex="0"><table><slot /></table></div>`
(Markdown tables have no caption syntax, so the label is always "Table"; spec FR-026). The `.table-wrapper` rules ported
from Flux already exist in `src/styles/global.css` (`overflow-x-auto`, borders, padding). The
table keeps its native semantics (FR-026); the focusable region lets keyboard users scroll it.
No client script.

**Alternatives considered**: CSS alone (`table { display: block; overflow-x: auto }`): some
browsers then drop table semantics from the accessibility tree, failing FR-026; a Sätteri hast
plugin wrapping each table (works for `.md` too, but posts are MDX-only and the `components`
prop is the documented, simpler route); rejected.

**Docs**: [MDX — Passing `components` to MDX content](https://docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content).

## R10. Share (port of `partials/ui-share.hbs`)

**Decision**: `src/components/post/Share.astro` at the end of every post. Always rendered, and
working without scripts: plain links to LinkedIn
(`https://www.linkedin.com/sharing/share-offsite/?url=…`) and email
(`mailto:?subject=<title>&body=<address>`), with visible text. A "Share" button is in the markup
but `hidden`; a small bundled script shows it only when `navigator.share` exists and calls
`navigator.share({ title, url })` on activation (an `AbortError` from a cancelled sheet is
ignored). The Ghost `#/share` portal link in Flux has no equivalent and is not ported; the
visual treatment follows Flux's `block` variant with existing tokens.

This is a second small script on the post page, outside the body; FR-025's "only script the post
body needs" is unaffected. Both scripts together must stay inside the 10 KB JS budget (R16).

**Docs**: [Scripts and event handling](https://docs.astro.build/en/guides/client-side-scripts/).

## R11. Feed with `@astrojs/rss`

**Decision**: add the official `@astrojs/rss` package (a helper library, not an integration
entry) and an endpoint `src/pages/writing/rss.xml.ts` whose `GET(context)` returns
`rss({ title: "Drift & Convergence", description, site: context.site, items, customData:
"<language>en-ca</language>", xmlns: { dcterms: "http://purl.org/dc/terms/" } })`. Items are
every non-draft post (always, R3), newest first, with `title`, `link` (`/writing/{slug}/`),
`pubDate` and `description` (the summary). An updated post adds
`customData: <dcterms:modified>ISO date</dcterms:modified>` (FR-020: "the feed MUST carry the
update date"; RSS 2.0 has no update field, and Dublin Core terms is a namespace feed validators
recognise). With no published posts the feed is valid and empty.

Autodiscovery: every blog page renders
`<link rel="alternate" type="application/rss+xml" title="Drift & Convergence" href=…>` through a
new named `head` slot in `BaseLayout.astro` (FR-037); the landing page shows a visible
"Subscribe (RSS)" link (FR-010).

**Docs**: [Recipes — Add an RSS feed](https://docs.astro.build/en/recipes/rss/);
[Using content collections](https://docs.astro.build/en/recipes/rss/#using-content-collections);
[Enabling RSS feed auto-discovery](https://docs.astro.build/en/recipes/rss/#enabling-rss-feed-auto-discovery);
[Endpoints — static file endpoints](https://docs.astro.build/en/guides/endpoints/#static-file-endpoints).

## R12. Home page "Recent writing"

**Decision**: a new section component, `RecentWriting`, registered in
`src/components/sections/index.ts` and `schemas.ts` (no props, no content), and placed in the
home page file `src/content/pages/index.mdx` as `<RecentWriting />` after the body text. It reads
`getPosts()` and renders the 3 newest as `PostCard`s in a `grid md:grid-cols-3` with a link to
`/writing/`, and renders nothing when there are no posts (FR-038). Keeping it a section keeps
the home page a content file Don can rearrange (Principle VI).

**Alternatives considered**: hard-coding the section into `PageLayout.astro` for the home page
(moves content decisions into layout code and is a busier shared file); rejected.

## R13. Navigation: "Writing" marked current on every blog page

**Decision**: add `isInSection(pathname, href)` to `src/lib/nav.ts` (true when `pathname`
starts with a non-root `href`). `SiteHeader.astro` sets `aria-current="page"` on an exact match
(unchanged) and `aria-current="true"` with the same underline style when the page is inside the
entry's section, so `/writing/all/2/` and `/writing/{slug}/` mark "Writing" (FR-004). This
amends feature 002's "current only on its exact address" rule for section entries; `/` never
matches as a section.

**Parallel work**: the portfolio feature needs the same rule for `/projects/…`. Whichever branch
merges second rebases and keeps one shared function; the unit test in
`tests/unit/site/navigation.test.ts` covers both prefixes after the rebase.

## R14. Post page, metadata and images

**Decision**:

- `src/layouts/PostLayout.astro` inside `BaseLayout`: optional hero (`PostHero`: the feature
  image full-bleed, eager with `fetchpriority="high"`), then the title card overlapping it
  (section name, `h1` title, summary, "Featured" mark, dates, reading time, topic pills, Draft
  notice), then the body in the existing reading column (`prose dark:prose-invert
  prose-accent`, FR-022), the "views are my own" note, Share, and Related posts.
- Dates are formatted with `Intl.DateTimeFormat("en-CA"…)` long month form and
  `timeZone: "UTC"` (YAML dates are midnight UTC; without the time zone a build in a western
  zone would print the previous day). The update reads "Updated September 30, 2026" in a
  `<time datetime>` (FR-020).
- `Seo.astro` gains optional `publishedTime` and `modifiedTime` props that emit
  `article:published_time` and `article:modified_time` when `type="article"` (FR-030). The
  sharing image is the feature image resized to 1200 px PNG with `getImage()`, as the page route
  already does; otherwise the site default.
- Body images reuse the existing `Figure`, `WideImage` and `FullImage` sections (captions,
  alt text required, `kg-width-*` behaviour that never scrolls sideways; FR-023).
- Cards use `<Image>` from `astro:assets` with `widths`/`sizes` and `loading="lazy"` except the
  lead story, keeping each page's transfer inside the budget (R16).

**Docs**: [Images — `<Image />`](https://docs.astro.build/en/guides/images/#image-);
[`getImage()`](https://docs.astro.build/en/reference/modules/astro-assets/#getimage);
[Layouts](https://docs.astro.build/en/basics/layouts/).

## R15. Build checks for post files

**Decision**: failures that the schema cannot express run in the post route's
`getStaticPaths()` (the same place feature 003 runs the page checks), over the file list from
`import.meta.glob("/src/content/posts/**/*")` so two files that make the same slug are both
seen:

- `.md` instead of `.mdx`; a post in a sub-folder; a file name outside lower-case letters,
  digits and hyphens; the reserved slugs `all` and `topics`; two files with one slug.
- The body checks reuse `validatePageBody()` from `src/lib/content/body.ts` (level-1 heading,
  unknown section tag, empty body, image without alt text) with the error prefix switched to
  "Post file" through a new optional parameter; `postFileError()`/`postFilesError()` join
  `src/lib/content/errors.ts`.

Every rule has a broken fixture in `tests/fixtures/posts/broken/` and a case in
`tests/build/post-validation.test.ts` ([contracts/build-errors.md](./contracts/build-errors.md)).

## R16. Test layers and fixtures (Principle I)

- **Unit / schema (Vitest, `tests/unit/`)**: `post-schema.test.ts` (every valid and invalid
  setting, using the `image` stand-in feature 003 uses), `topics.test.ts` (distinct colours,
  style map coverage, id format), `post-address.test.ts`, `post-order.test.ts` (landing,
  related, recent, ordering ties), `reading-time.test.ts`, `build-mode.test.ts`,
  `shiki-classes.test.ts` (runs the transformer through Astro's Shiki helper on samples of
  several languages and plaintext; asserts no `style`, expected classes, caption, unknown-colour
  error), `share-links.test.ts`, `feed.test.ts` (item mapping), plus updates to
  `navigation.test.ts`, `csp.test.ts` (style directive still has no `'unsafe-inline'`),
  `astro-config.test.ts`/`config-mdx.test.ts` (processor, Shiki theme, env schema).
- **Component (Astro Container API, `tests/component/post/`)**: `PostCard` (image and text-only
  variants, Featured mark, pills link to topics), `TopicPill`, `TopicBanner`, `LeadStory`,
  `FeaturedGrid` (1, 2, 3 cards), `Pagination` (current page `aria-current="page"`), `CodeBlock`
  (caption, hidden button), `ScrollTable`, `Share`, `ViewsNote`, `RelatedPosts`,
  `RecentWriting`, `PostLayout` (dates, Draft notice), `Seo` article times.
- **Build (`tests/build/`)**: `post-validation.test.ts` (every row of the build-errors contract),
  `one-file-post.test.ts` (adding one valid post file makes its page, listing, topic, feed and
  home entries: SC-002), `blog-listing.test.ts` (13+ fixture posts: page 2 exists, `/all/1/`
  does not, empty topic page, feed contents and validity), and `build-env.test.ts` gains the
  production assertions (no draft page, feed item or sitemap entry on `main`; drafts present on
  a preview branch) (SC-004).
- **E2E (Playwright, real browser against `wrangler dev`)**: `blog.spec.ts` (landing order,
  navigation to posts and topics, `aria-current` on "Writing", no-JS reading, copy button with
  clipboard permission granted and denied, share links, Web Share stubbed on and off, no CSP
  violations, no `[style]` in code, no sideways scroll at 320 px with the wide-table and
  long-code sample, `/writing/all/1/` and `/writing/all/99/` are 404). Pagination beyond page 1
  runs against the fixture site on port 4322, which gains generated fixture posts
  (`scripts/build-fixture-site.ts`).
- **Accessibility**: the blog templates (`/writing/`, `/writing/all/`,
  `/writing/topics/{topic}/`, a post) are added to `TEMPLATES` in `tests/e2e/templates.ts`, so
  the existing `a11y` project checks them with axe (WCAG 2.2 AA tags) at phone and desktop widths
  in both themes, with the menu open and without JS, and the `budget` project measures them.
  `tests/e2e/blog.a11y.spec.ts` adds the checks axe does not make (heading structure, focus
  order and indicator, target size, reduced motion, forced colours, 320 px with text spacing,
  failed images, script inventory), and `tests/e2e/blog-fixture.a11y.spec.ts` covers listing
  page N ≥ 2 on the fixture site and the empty pages of a production-mode build served through
  `page.route`, so every FR-039 template is checked. Both match the existing `a11y` project by
  file name.
- **Visual (per-platform baselines)**: see plan § Visual baselines.

**Budget risk**: the landing page shows several card images. Sample images are small, simple
graphics; cards use responsive `<Image>` with lazy loading below the fold. If the 100 KB total
budget still fails, the fix is smaller images or fewer eager images, never a weaker budget
(Principle II).

**Docs**: [Testing — Container API](https://docs.astro.build/en/guides/testing/#container-api);
[Testing — End-to-end tests / Playwright](https://docs.astro.build/en/guides/testing/#playwright).

## R17. Running cost

No new service, binding, Worker code or storage. The blog is static assets inside the existing
Worker's free plan; `@astrojs/rss` and `satteri` run only at build time. Expected monthly cost:
**$0** (Principle IX; total remains within the $13 ceiling).

## Spike results (Phase 1, tasks T003 to T006)

Recorded while implementing Phase 1. None of the spikes needs a plan change.

- **Spike 1, Shiki in the Sätteri pipeline and the MDX `pre` override (T003, R7, R8): passes.**
  `tests/build/code-highlighting.test.ts` builds a fixture site whose config sets a placeholder
  `markdown.shikiConfig.theme` and a transformer. Findings:
  - `markdown.shikiConfig.transformers` is honoured by the default Sätteri processor
    (`@astrojs/markdown-satteri` passes them to `codeToHast`), so no processor change is needed.
  - The `span` hook sees `style="color:#rrggbb"` per token and can swap it for an `hl-*` class.
  - The `pre` hook **runs after Astro's own `overflow-x: auto` is appended**, so deleting
    `node.properties.style` there removes the background, colour and overflow style together.
    Overflow moves to CSS (`pre { overflow-x: auto }`).
  - A `root` hook that throws on any surviving `style` fails the build: the error surfaces as an
    `MDXError` whose message carries the thrown text, so the colour or attribute is named.
    Removing the `pre` deletion made the build fail with the `pre` style named, which proves the
    guard works.
  - `meta.__raw` on the transformer context carries the fence's meta string, so
    ```` ```ts caption="…" ```` reaches `data-caption` without a wrapper component.
  - With a `components.pre` override in `<Content components={…} />`, the highlighted `<pre
    class="astro-code">` is rendered inside the override, and the page's CSP meta tag is
    byte-identical to the site's current one (no `'unsafe-inline'` in `style-src`).
  - Astro prints a config warning ("Shiki syntax highlighting uses inline styles that are not
    compatible with CSP") on every build. It is informational: the transformer removes the
    styles. The CSP is not loosened and the `attribute` fallback and Prism stay unused.
  - Harness change: `buildFixtureSite()` gained an `overrides` option (write or patch files in
    the copied site, such as `astro.config.mjs`). The spike used the pages collection because
    the `posts` collection does not exist yet; T031 moves the test onto a post fixture.
- **Spike 2, `paginate([])` (T004, R4): one page with empty data.** With `params` given,
  `paginate([], { params: { topic }, pageSize })` yields exactly one path (`/topics/empty/`),
  with `page.data.length === 0`, `currentPage === 1` and `lastPage === 1`. No extra code is
  needed for an empty topic; the route only has to render an empty state when `page.data` is
  empty. (The throwaway site lived under `.cache/spike-paginate/`, not committed.)
- **Spike 3, impossible dates (T005, R1): the YAML parser rolls them over.** Astro's glob
  loader parses front matter with js-yaml (`@astrojs/internal-helpers/frontmatter`). A bare
  `2026-02-30` parses to a `Date` for **2 March 2026** and `z.date()` accepts it. A quoted
  date, `27/08/2026` and `next tuesday` are strings and fail `z.date()`. A timestamp such as
  `2026-08-27T10:30:00Z` also passes `z.date()`. So R1's named fallback is required in T015: a
  check on the raw front matter text (`rawFrontmatter`), requiring `date:` and `updated:` to be
  exactly `YYYY-MM-DD` and to round-trip to the same calendar day. That single check also
  rejects timestamps. The first cases are in `tests/unit/content/post-schema.test.ts`; T008
  replaces the characterisation of the roll-over with the real rejection cases.
- **Spike 4 groundwork, full-listing page weight (T006, FR-041).** Method: measure
  `/writing/all/` of the fixture site populated with 13 or more generated posts (12 cards on
  page 1), each with a small generated feature image, using the `budget` Playwright project's
  existing `measure()` (simulated slow 4G, 4x CPU, 390x844, cache disabled). Thresholds are the
  existing ones in `tests/e2e/budget.spec.ts`: total 100 KB, JavaScript 10 KB, LCP 2.5 s, CLS
  below 0.1, long-task blocking 200 ms. The generator is built in T026 and the measurement runs
  in T061. If it fails, the fix is smaller or fewer eager images, never a weaker budget.
- **Spike 4 result, full-listing page weight (T061, FR-041).** Measured on `/writing/all/` of the
  fixture site (17 posts, 12 cards on page 1, lazy card images): total transferred 43,081 bytes
  (budget 100 KB), JavaScript 0 bytes (10 KB), LCP 736 ms (2.5 s), CLS 0 (0.1), long-task blocking
  0 ms (200 ms). The budget holds with no change to images or thresholds.
