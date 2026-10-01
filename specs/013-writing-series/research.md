# Research: Frame the Writing pages around Drift & Convergence

Astro choices were checked with the Astro Docs MCP (`astro-docs`) on 2026-10-01; each
decision names the page that supports it. The spec's Clarifications are settled decisions and
are not reopened here.

## R1. Series are controlled topics with a `series` flag

- **Decision**: Add `drift` and `convergence` to `topics` in `src/config/topics.ts` with
  `series: true`, a name, a one- or two-sentence description and a colour. Ordinary topics get
  no flag (absent means `false`). Derived exports: `seriesIds`, `isSeries(id)`,
  `controlledIds` (all six), `pillRowTopics` (the four non-series topics, for the landing row).
- **Rationale**: FR-001/FR-002 require series to be topics named in `topics:`, and the spec
  rules out a new post setting. One list keeps the unique-colour rule covering series and topics
  together (FR-010a), and the existing unit test already iterates the list.
- **Alternatives considered**: a separate `series.ts` list (two sources of truth, the
  unique-colour rule would need a cross-list check); a `series` front-matter field (ruled out
  by the spec's Out of Scope).

## R2. Canonical series pages are static route folders

- **Decision**: `src/pages/writing/drift/[...page].astro` and
  `src/pages/writing/convergence/[...page].astro`, each a few lines that call
  `getStaticPaths` with `paginate()` over the series' visible posts and render a shared
  `SeriesPage.astro` component. The topic route `src/pages/writing/topics/[topic]/[...page].astro`
  no longer builds pages for series ids.
- **Rationale**: Astro's route priority puts static segments ahead of named parameters
  (docs.astro.build/en/guides/routing/#route-priority-order), so `/writing/drift/` can never
  be claimed by `src/pages/writing/[slug].astro`, and `PrerenderRouteConflict`
  (docs.astro.build/en/reference/errors/prerender-route-conflict/) cannot arise. Pagination
  reuses `paginate()` exactly like topic pages
  (docs.astro.build/en/guides/routing/#nested-pagination); an empty series still builds one page
  with the empty-listing message (spec 008 spike 2).
- **Alternatives considered**: one dynamic `src/pages/writing/[series]/[...page].astro`
  (works, but shares the `/writing/{x}/` shape with `[slug].astro`, relying on the slug guard
  alone to avoid a collision); generating the series pages from the topic route at a second
  address (no way to emit two addresses from one route file without a rewrite).

## R3. Redirects from the old topic addresses use Cloudflare `public/_redirects`

- **Decision**: Add `public/_redirects` (copied to `dist/` by Astro):

  ```text
  /writing/topics/drift          /writing/drift/              301
  /writing/topics/drift/*        /writing/drift/:splat        301
  /writing/topics/convergence    /writing/convergence/        301
  /writing/topics/convergence/*  /writing/convergence/:splat  301
  ```

  `/writing/topics/drift/` matches the splat rule with an empty splat and lands on
  `/writing/drift/`; `/writing/topics/drift/2/` lands on `/writing/drift/2/`.
- **Rationale**: Astro's own `redirects` option, for a static build with no adapter, writes
  `<meta http-equiv="refresh">` HTML files and "does not support status codes"
  (docs.astro.build/en/reference/configuration-reference/#redirects;
  docs.astro.build/en/guides/routing/#configured-redirects). The site has no Astro adapter (the
  Worker is separate and only runs for `/api/*`), so Astro's option would serve a 200 page that
  search engines treat as a soft redirect, and it would also need a destination route with the
  same parameters. Cloudflare Workers static assets support a `_redirects` file in the assets
  directory with splats and 301s, applied before headers and assets, up to 2,000 static + 100
  dynamic rules (developers.cloudflare.com/workers/static-assets/redirects/). It is first-party,
  free, committed and deployed with the build (Principle VIII), and `wrangler dev` (the E2E
  server) serves the same `dist/`. Trailing-slash forms are distinct in `_redirects`, hence
  both the bare and splat rules.
- **Alternatives considered**: Astro `redirects` (above); handling the paths in the Worker
  (would widen `run_worker_first` beyond `/api/*`, against Principle VIII); a Cloudflare
  Single Redirect rule (dashboard or API state outside the repo, against "committed and
  applied through CI").
- **Guard**: the topic route must not build `/writing/topics/drift/` or
  `/writing/topics/convergence/`, so no asset ever shadows a redirect. A unit test parses
  `public/_redirects` and asserts the four rules derive from `seriesIds`; an E2E test asserts
  the 301 and `Location`.

## R4. Free-form topics and the build-time guards live in the content collection schema

- **Decision**: In `postSchema` (`src/content/schemas/post.ts`), `topics` becomes an array of
  strings matching `^[a-z0-9-]+$`, at most 40 characters, at least one, each named once
  (existing rules). The existing `superRefine` adds two checks:
  1. **Both series**: if `topics` includes both series ids, an issue on `topics`:
     "A post can be in one series only. Remove drift or convergence from topics."
  2. **Near-miss**: for each id that is not controlled, if `editDistance(id, c) ≤ 2` for some
     controlled id `c`, an issue: `"convergance" is not a topic. Did you mean "convergence"?
     Topics: compliant-data, technology-teams, agentic-ai, healthcare-leadership, drift,
     convergence.` (closest id wins; ties go to list order). Listing every controlled id keeps
     contract row P6's expectation.
  The pure helpers (`editDistance`, `nearestControlled`, `topicLabel`) live in
  `src/lib/content/topic-ids.ts`.
- **Rationale**: Astro validates every entry against the collection schema and fails the build
  with an error that names the entry and file
  (docs.astro.build/en/guides/content-collections/#defining-the-collection-schema; Zod 4 via
  `astro/zod`). The schema already uses `superRefine` for the duplicate-topic and date-order
  rules, so the new guards sit beside them and are covered by the same schema unit tests and
  build-fixture tests. Zod has no edit-distance primitive; a 15-line Levenshtein is smaller
  than any dependency (Principle IV custom-code justification).
- **Alternatives considered**: `z.enum` over controlled ids plus a separate free-form field
  (contradicts FR-002/FR-011: topics are one list); checking in the route or in
  `getPostSummaries()` (later and further from the file than the schema; Astro's schema error
  already names the file).

## R5. Reserved slugs `drift` and `convergence`

- **Decision**: `RESERVED` in `src/lib/content/post-address.ts` becomes
  `new Set(["all", "topics", ...seriesIds])`; the message stays "the address /writing/drift/
  is reserved for a listing page. Rename the file." (row P16 shape).
- **Rationale**: The slug is the file name (glob loader `generateId`,
  docs.astro.build/en/reference/content-loader-reference/#glob-loader), and the existing
  post-file check already rejects reserved slugs with a plain message. Deriving from
  `seriesIds` keeps the two lists in step.
- **Alternatives considered**: a schema rule (the schema does not see the file name).

## R6. Colours and contrast

- **Decision**: Drift `lavender`, Convergence `sage` (flux `.reference/flux/CLAUDE.md`:
  "Drift newsletter | Lavender", "Convergence newsletter | Sage"); Agentic AI → `mauve`,
  Technology teams → `sand`; free-form pills and banners `dusk`. Add `sand`, `mauve`, `dusk`
  entries to `topicStyles` using the same shade pattern as the others (pill 100/900 light,
  900/100 dark; banner 100/950 light, 900/50 dark; border 600/400). The series marker reuses
  the palette pill colours plus `font-semibold border-2` with an outline of shade 700 (light)
  and 300 (dark).
- **Pre-computed contrast** (same HSL-from-BASE formula as `tests/unit/content/topics.test.ts`):

  | Palette | pill light | pill dark | banner light | banner dark | outline 700 on 100 | outline 300 on 900 |
  |---|---|---|---|---|---|---|
  | lavender | 13.81 | 13.81 | 14.72 | 16.14 | 8.69 | 6.75 |
  | sage | 13.69 | 13.69 | 16.21 | 14.81 | 4.99 | 9.80 |
  | mauve | 13.96 | 13.96 | 15.45 | 15.73 | — | — |
  | sand | 13.94 | 13.94 | 15.59 | 15.59 | — | — |
  | dusk | 13.95 | 13.95 | 15.09 | 16.00 | — | — |

  All text pairs exceed 4.5:1; marker outlines exceed the 3:1 non-text minimum against the
  marker fill. The token-contrast unit test also computes each outline against the surfaces the
  marker sits on (card `white` / `dusk-800`, page background) and records the values (spec
  FR-010, FR-016c); if a pair falls under 3:1 the outline moves to another existing shade of
  the same palette, never a new colour. The existing
  unit test's `PALETTES` already lists all seven palettes, so only its expected topic list
  and the new style entries change; the marker and the free-form pill join its contrast cases.
- **Alternatives considered**: flux's rust for free-form tags (taken by Compliant data, and the
  spec requires neutral); new tokens (forbidden by FR-010a).

## R7. Marker, ordering and the card's main topic

- **Decision**: `orderTopics(ids)` returns the series id first, then the rest in front-matter
  order; `mainTopic(ids)` returns the series id if present, else the first controlled id, else
  none (a free-form-only text card keeps the neutral `dusk-200/700` border it has today when
  no topic matches). `TopicPill` renders `SeriesMarker` for series ids, a coloured pill for
  controlled ids, and a `dusk` pill labelled by `topicLabel()` for free-form ids. The marker's
  text is "Series: Drift" (visible text, so screen readers and forced-colours mode keep the
  distinction; FR-010, US3-4) and links to `/writing/drift/`.
- **Rationale**: FR-010 says the marker appears before other topics and the series colours a
  text-only card. Keeping one entry component (`TopicPill`) means every place that lists pills
  (PostCard, LeadStory, PostMeta, RelatedPosts via PostCard) changes in one spot.

## R8. Copy

- **Decision** (Don can revise in review; FR-017, `VOICE.md`):
  - `blog.feedDescription`: "Writing by Don Coleman in two series: Convergence, on systems
    leadership and leading change, and Drift, on trying new technology and building real
    projects." Used by the feed and as the landing's meta description (FR-007, FR-013).
    `feedTitle` stays "Drift & Convergence".
  - Series descriptions (topics.ts, also the banner and framing lead):
    Convergence: "Systems leadership: how to create alignment, work through complexity and
    lead change when the path forward isn't clear." Drift: "Hands-on exploration of emerging
    technology: trying new tools, building real projects and writing up what worked and what
    didn't."
  - Landing framing lead: one sentence naming Drift & Convergence, then one short block per
    series with its description and a link "Read Convergence" / "Read Drift".
  - Home line under "Recent writing": "From Drift & Convergence: [Convergence](/writing/convergence/)
    on systems leadership, [Drift](/writing/drift/) on hands-on technology."
  - About: one short paragraph introducing Drift & Convergence with links to both series pages,
    replacing the two long paragraphs; the contact invitation stays.
- **Rationale**: shortened from the About page's existing descriptions, as the spec assumes.

## R9. Existing tests and contracts this spec changes

- `tests/unit/content/topics.test.ts` "starts with the four agreed topics": now six entries
  with the new colours.
- `tests/unit/content/blog-config.test.ts`, `tests/unit/site/feed.test.ts`: new description.
- Contract 008 row **P6** (`agentic-a1`): still fails, now with "Did you mean
  "agentic-ai"?" plus the full id list, so the existing assertion holds.
- Contract 008 row **P21** (a topic removed from the list while a post names it): under
  FR-011 a removed id is an ordinary free-form topic, so the build **succeeds** and the post
  shows a neutral pill linking to `/writing/topics/{id}/`. This is a deliberate, reviewed
  change of contract (FR-011 makes free-form topics valid), not a weakened check; the test is
  rewritten to assert the free-form result. If the removed id is within two letters of a
  remaining id, the near-miss rule still fails the build.
- `tests/e2e/not-found.spec.ts` lists `/convergence/` (site root) as retired: unaffected,
  the new pages are under `/writing/`.
- Visual baselines named in the plan.

## R10. Cost

- **Decision**: none required. `_redirects`, extra static pages and copy changes run inside
  the Workers free plan. **Expected new monthly cost: $0.**
