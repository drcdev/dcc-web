# Data model: Standalone pages

**Feature**: `003-standalone-pages` | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

There is no database. Every entity is a file in the repository, validated at build time by a Zod
schema (content collection) or by a typed TypeScript module. Field names below are the exact
frontmatter keys Don writes.

## Page (collection `pages`)

One file in `src/content/pages/` (`.md` or `.mdx`; `.mdx` to use sections). Schema:
`pageSchema({ image })` in `src/content/schemas/page.ts`; every object is strict (unknown keys
fail the build).

| Key | Type | Required | Default | Rule / spec |
|---|---|---|---|---|
| `title` | string, trimmed, ≥ 1 char | yes | — | Main heading and document title (FR-004, FR-005). |
| `description` | string, trimmed, ≥ 1 char | yes | — | Meta and sharing description. Length is guidance only, not enforced (edge case). |
| `image` | `{ src: image(), alt: string ≥ 1 }` | no | site default `/og-default.png` | Sharing image; both or neither by shape (FR-004). |
| `featureImage` | `{ src: image(), alt: string ≥ 1, caption?: string }` | no | none (no gap rendered) | Shown at the top of the content (US4 scenario 6). |
| `nav` | `{ position: int ≥ 1, label?: string ≥ 1 }` | no | absent = not in header navigation | `label` defaults to `title` (edge case). Duplicate `position` across pages or fixed entries fails the build (FR-008). |
| `draft` | boolean | no | `false` | `true` renders the draft notice (FR-015). Does not affect indexing or the sitemap (FR-006). |
| `intro` | `HomeIntro` (below) | no | — | Only meaningful on the home page; replaces the title heading with the introduction card. |
| *(body)* | Markdown / MDX | yes (non-empty) | — | Empty body fails the build (edge case, FR-007). |

**Derived values** (not written by Don):

| Value | Derivation |
|---|---|
| `id` | `addressFromPath(file)` via the loader's `generateId`: path under `src/content/pages/` without extension, a trailing `/index` removed. Every segment must match `[a-z0-9-]+` (otherwise `PageContentError`, spec FR-003). `index.mdx` → `index`. |
| address | `/` for id `index`; otherwise `/${id}/` (FR-003). |
| document title | Site name for `/`; `"{title} · Don Coleman"` otherwise (existing `Seo.astro`). |
| canonical / `og:url` | Absolute address against Astro `site` (existing `Seo.astro`). |
| sharing image URL | `getImage()` output of `image.src` (1200 px wide, PNG), or the site default. |

**Invariants checked at build** (each raises `PageContentError` naming the file(s)):

1. Schema valid (Astro's collection error names the entry and key).
2. Body non-empty.
3. No two page files share an address; no page address equals an address produced by another
   route file in `src/pages/` or one of the reserved `futureDestinations` (`/writing/`,
   `/projects/`, `/contact/`).
4. Every capitalised JSX tag in the body is a registered section (outside code fences).
5. Every Markdown image in the body has non-empty alt text.
6. Section props valid (see Section).
7. No two navigation entries share a position.
8. The body has no level-1 Markdown heading (`# …`) or `<h1>`: the page title is the only main heading (FR-014).
9. Every path segment of the file name uses only lower-case letters, digits and hyphens (FR-003).

**Lifecycle**: `draft: true` (launch placeholder) → Don edits copy → removes `draft` → notice
disappears. No other states.

## HomeIntro (object inside a Page)

| Key | Type | Required | Notes |
|---|---|---|---|
| `photo` | `{ src: image(), alt: string ≥ 1 }` | yes | Don's photo, `src/content/pages/images/don-coleman.jpg`. |
| `name` | string ≥ 1 | yes | Rendered as the page's only `<h1>` (FR-016). |
| `tagline` | string ≥ 1 | yes | Under the name, italic (Flux `@site.description`). |
| `bio` | string ≥ 1 | yes | Short paragraph. |
| `cta` | `{ label: string ≥ 1, href: string }` | yes | `href` is an internal address (`/…/`) or `https://` URL. Launch value `/services/` (FR-017). |

Social links are **not** in the page file: they come from `socialNavigation` in
`src/config/navigation.ts` so the card and footer cannot drift apart (FR-016).

## Section (MDX component)

Registered in `src/components/sections/index.ts`; props validated by the Zod schemas in
`src/components/sections/schemas.ts`. Full usage contract: [contracts/sections.md](./contracts/sections.md).

| Section | Props (required **bold**) | Children |
|---|---|---|
| `Lead` | — | paragraph text (required) |
| `TextBlock` | **`title`** | Markdown (required) |
| `Offerings` | `title` (optional list heading) | one or more `Offering` |
| `Offering` | **`title`**, `href` | short description (required) |
| `CallToAction` | **`label`**, **`href`** | short message (optional) |
| `Figure` | `caption` | exactly one Markdown image with alt text |
| `WideImage` | `caption` | exactly one Markdown image with alt text |
| `FullImage` | `caption` | exactly one Markdown image with alt text |

## NavigationItem (existing, extended)

`src/config/navigation.ts` (foundation). Adds `position` to the primary entries that stay fixed.

| Field | Type | Notes |
|---|---|---|
| `label` | string | Link text. |
| `href` | string | Internal `/…/` or external `https://`. |
| `kind` | `"primary" \| "footer" \| "social"` | Unchanged. |
| `position` | int ≥ 1 | **New**, primary only. Fixed: Writing 4, Projects 5, Contact 7. |
| `source` | string | **New**, for error messages only: the page file path, or `src/config/navigation.ts` for fixed entries. |

`primaryNavigation` (the fixed seven-item list) is replaced by `fixedPrimaryNavigation` (three
items) plus page-derived entries; `mergeNavigation()` returns the ordered list, which at launch is
exactly Home, Services, Speaking, Writing, Projects, About, Contact (FR-025).
`futureDestinations` becomes `["/writing/", "/projects/", "/contact/"]` (FR-027).

## PageContentError

`src/lib/content/errors.ts`. `class PageContentError extends Error` with
`message = "Page file <repo-relative path>: <problem>"` and, for two-file problems,
`"Page files <a> and <b>: <problem>"`. Messages are plain language and say what to change
(contract: [contracts/build-errors.md](./contracts/build-errors.md)).

## Launch content (files created in this feature)

| File | Address | `nav` | `draft` | Content source |
|---|---|---|---|---|
| `index.mdx` | `/` | `{ position: 1, label: "Home" }` | true | `intro` card + who Don helps / what he does; no `CallToAction` in the body. |
| `services.mdx` | `/services/` | `{ position: 2 }` | true | Kinds of work, how he works, what he does not do (FR-021). |
| `speaking.mdx` | `/speaking/` | `{ position: 3 }` | true | Topics, past talks, organiser bio + photo (`Figure`). |
| `about.mdx` | `/about/` | `{ position: 6 }` | true | Background, credentials, practice alongside full-time role. |
| `privacy-policy.mdx` | `/privacy-policy/` | — | true | New text absorbing the cookie policy (FR-022). |
| `terms-of-use.mdx` | `/terms-of-use/` | — | true | From the current site, corrected (FR-023). |
| `technology.mdx` | `/technology/` | — | true | From the current site, corrected (FR-023). |
