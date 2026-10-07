# Data model: Page visibility and draft flags, file-driven navigation (029)

All entities are front matter in Markdown/MDX files validated by content collection schemas
(Principle VI) or values derived from them at build time. Nothing is stored at runtime.

## Page (collection `pages`, `src/content/pages/**/*.{md,mdx}` except the landing files)

Existing fields are unchanged except `nav`. New or changed fields:

| Field | Type | Default | Rule |
|---|---|---|---|
| `visible` | boolean | `true` | Not boolean → schema error naming the file and `visible`. |
| `draft` | boolean | `false` | Unchanged. |
| `nav` | object, optional | absent | Absent → the page is in no menu (FR-006). Strict object. |
| `nav.location` | `"header"` \| `"footer"` | required inside `nav` | Other value → schema error naming `location` (FR-010). Missing → schema error naming `location` (FR-007). |
| `nav.position` | integer ≥ 1 | required inside `nav` | Missing → schema error naming `position` (FR-007). |
| `nav.label` | non-empty text | the page `title` | Unchanged (empty or whitespace-only fails). Link text must be unique within its menu (V11). |

Extra rule, checked in the loader's `generateId` (the schema cannot see the id):

- The page with id `index` (the home page) must not have `visible: false`, on any build (FR-010).
  It may have `draft: true`.

### Derived per build

`includeDrafts` = `includeDrafts({ WORKERS_CI, WORKERS_CI_BRANCH })` (`src/lib/build-mode.ts`):
false only on the Workers Builds build of `main`.

| `visible` | `draft` | Production build | Preview / local / CI build |
|---|---|---|---|
| true | false | built, indexable, in sitemap, in its menu | built, in sitemap, in its menu; noindex meta because every page of a non-production build has it (`isIndexableBuild()`, unchanged) |
| true | true | built, draft notice, noindex, not in sitemap, in its menu | same |
| false | any | **not built**, in no menu, not in sitemap, own images pruned | built, draft notice, noindex, not in sitemap, in its menu |

- `inThisBuild(page)` = `page.visible || includeDrafts`.
- `showsDraftNotice(page)` = `page.draft || !page.visible` (only reachable for a not-visible page
  when it is built, that is on non-production builds).
- `unlisted(page)` (sitemap filter) = `page.draft || !page.visible`.

## Landing page file (collection `landing`, `src/content/pages/{writing,projects}.{md,mdx}`)

| Field | Type | Rule |
|---|---|---|
| `title` | non-empty text | Required. Used as the menu label when `nav.label` is absent. |
| `nav` | the same `nav` object as Page, with `location` fixed to `"header"` | Required (a landing file exists only to give its menu entry). `location: footer` fails naming `location` (V12). |

- Strict schema: any other key, including `visible`, `draft` and `description`, fails the build
  naming the key (FR-008).
- Body must be empty (whitespace only); checked in `generateId`, error names the file (FR-008).
- Always in every build; never draft; its address comes from `landingPages` (below), not from
  the file name route.
- Both files must exist; `getNavigation()` throws a plain error naming the missing file
  (FR-010).

### `landingPages` (constant, `src/config/navigation.ts`)

`{ writing: "/writing/", projects: "/projects/" }` — the landing ids and the addresses their code
routes build. It names routes, not menu settings.

## NavigationItem (unchanged type, `src/config/navigation.ts`)

`{ label, href, kind: "primary" | "footer" | "social", position?, source? }`. Header items have
`kind: "primary"`, footer items `kind: "footer"`; `source` is the page file, for error messages.

## SiteNavigation (new, returned by `getNavigation()`)

`{ header: NavigationItem[]; footer: NavigationItem[] }` — each the pages (and landing files) in
this build whose `nav.location` names that menu, ordered by `nav.position`.

- Two entries in one menu with one position → `Page files <a> and <b>: both use header position N.
  Change the position in one of them.` (FR-009; files in path order; with three or more, the
  first pair). The same position in the header and the footer is allowed.
- Two entries in one menu with the same link text (case and surrounding spaces ignored) →
  `Page files <a> and <b>: both show "<text>" in the header. Give one of them a different label.`
  (FR-009a, V11).
- A menu with no entries is an empty array; `SiteFooter` then renders no link list. The header
  is never empty, because both landing files are always in it.
- `socialNavigation` stays a constant in code and is rendered by `SiteFooter` as today.

## Content after the change (FR-011, SC-005)

| File | `visible` | `draft` | `nav` |
|---|---|---|---|
| `index.mdx` | (default) | true | header 1, label Home |
| `work-with-me.mdx` | (default) | true | header 2 |
| `writing.mdx` (new, landing) | — | — | header 4 |
| `projects.mdx` (new, landing) | — | — | header 5 |
| `about.mdx` | (default) | false | header 6 |
| `contact.mdx` | (default) | (default) | header 7 |
| `privacy-policy.mdx` | (default) | true | footer 1 |
| `terms-of-use.mdx` | (default) | true | footer 2 |
| `technology.mdx` | (default) | true | footer 3 |
| `privacy/tempo.mdx` | (default) | (default) | none |

Draft flags are left exactly as they are; only menu settings move into the files.
