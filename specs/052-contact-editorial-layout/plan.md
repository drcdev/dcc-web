# Implementation Plan: Two-column editorial layout for the contact page

**Branch**: `052-contact-editorial-layout` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/052-contact-editorial-layout/spec.md` (issue #188)

## Summary

On wide screens the contact page becomes two columns under the full-width "Contact" title. On the
left is a note from Don ("Before you write"), with GitHub, LinkedIn and email quick links. On the
right is the existing form, with the privacy paragraph moved under "Send a message". Below 1024 px
the columns stack, note first.

The change lives in one component and one content file. `<ContactForm>` gains two Astro slots.
A named `note` slot is filled from a `<div slot="note">` in `contact.mdx`, and the default slot
carries the existing privacy paragraph. When the note is present, the component wraps the two
columns in a Tailwind `lg:grid-cols-12` grid (5 + 7). It draws the note's `h2` and renders the
quick links from `socialNavigation`, the existing GitHub/LinkedIn icons, a new `mail.svg`, and a new
`site.contactEmail`. The form's fields, ids, island script and CSP do not change. No JavaScript,
dependency, endpoint or service is added.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`); Astro 7.3.5, `@astrojs/mdx`, Tailwind CSS 4 with `@tailwindcss/typography`

**Primary Dependencies**: Astro named slots and `Astro.slots.has()`, Astro SVG components, the existing section registry. No new packages.

**Storage**: N/A. Content stays in `src/content/pages/contact.mdx`. There is no D1, KV or Worker change.

**Testing**: Vitest (unit; component tests through the Astro Container API), Playwright (`e2e`, `a11y`, `visual`, `budget` projects), per `docs/testing.md` "Where a test goes"

**Target Platform**: A static page on Cloudflare Workers static assets (unchanged)

**Project Type**: Static Astro site with one Worker for `/api/*` (the Worker is not touched)

**Performance Goals**: `/contact/` stays inside the CI performance budget (`budget.spec.ts`). No client JS is added. The note adds a few hundred bytes of HTML and three inline SVGs.

**Constraints**: WCAG 2.2 AA in both themes at every width. No sideways scroll from 320 px. Readable with JS off. Reading order matches visual order. Form behaviour unchanged (FR-011 to FR-014).

**Scale/Scope**: One component edited, one content file edited, one icon and one config field added, one fixture page edited, eight baselines refreshed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes, no exceptions.*

| # | Principle | Status | How this plan meets it |
|---|-----------|--------|------------------------|
| I | Test-First | PASS | Tests are written and seen to fail before the component changes. **Component** (Container API, `ContactForm.test.ts`): contract rows L1–L11 (note `h2` and its level, `aria-labelledby`, quick links from `socialNavigation` in the same tab, a `mailto:` with the address as text, `aria-hidden` icons, grid classes, DOM order, privacy slot placement) and N1–N2 (no note → no grid, form as today). **Unit**: the shown address equals the address the privacy policy publishes; `contact.mdx` puts the note in `slot="note"` with the privacy link outside it. **E2E** (`contact.spec.ts`, real `/contact/`): columns side by side, top-aligned and 5:7 at 1024/1280 px; stacked at 1023/375 px; no sideways scroll at 1023; quick links before Name in tab order; valid send and `?project=` at 390 px. **A11y and visual** run on the template (existing `TEMPLATES` loop, the "contact form states" block, the `contact-form` fixture subject). Layers and second-layer reasons are in research.md R10. |
| II | Automated Release Gate | PASS | Nothing is skipped or loosened. Eight baselines are refreshed, not weakened or removed, and the threshold stays. The full `pnpm run verify` runs before the PR (after asking Don, per the local gate notes). |
| III | Human Review of Every Change | PASS | One PR from `drc-agents`, auto-merge armed after the final push. The note wording (FR-004 to FR-006, FR-010) and a real send on the preview are `[PREVIEW-CHECK]` items. |
| IV | First-Party Before Custom | PASS | Every capability uses an Astro or Tailwind first-party feature (table below). The Astro Docs MCP was available and used, and research.md cites each page. There is no custom code beyond component markup and one config field. |
| V | Static by Default | PASS | The page stays prerendered. No endpoint, island or script is added. The note and links are static HTML, readable with JS off (FR-009; covered by `no-js.spec.ts` on `/contact/`). |
| VI | Content as Files | PASS | The note text and the privacy paragraph stay in `src/content/pages/contact.mdx` as Markdown, so Don edits them without touching a component (FR-009). Bad bodies still fail the build through `validatePageBody`. Only the fixed `h2` label and the link list live in code, like "Send a message". |
| VII | Private Data | PASS | No field, storage or delivery change. The page shows `contact@doncoleman.ca`, which the privacy policy and terms already publish. It is a plain `mailto:`, with no form and no script. The Worker's delivery address (`CONTACT_DESTINATION`) is not read by the page. |
| VIII | Cloudflare Best Practices | PASS (n/a) | No Worker, binding, route, header or Turnstile change. The CSP still allows Turnstile on `/contact/` only (component + route check; e2e CSP test unchanged). |
| IX | Cost Ceiling | PASS | **Expected new monthly cost: $0.** No new service, binding, storage, package or request. |
| X | Accessible, Fast and Private | PASS | Heading order: one `h1` (title), then two `h2`s in reading order. The columns follow source order (WCAG 1.3.2, 2.4.3). Icons are `aria-hidden` and visible text names each link. Focus outlines and colour pairs reuse measured tokens (contract L7). Axe runs in both themes at both widths, idle and in every form state. No third-party script is added. The budget check covers `/contact/`. |
| XI | Spec Kit Workflow | PASS | Branch and directory come from Spec Kit. Files shared with sibling worktrees are listed below, with how each conflict is handled. |
| — | Security Baseline | PASS | `public/_headers`, the ruleset, Dependabot and the contact API's Turnstile, honeypot and same-origin checks are unchanged. No visitor input is added. |
| — | Development Workflow | PASS | Astro choices cite docs (research.md R1, R6, R7). Tests come before code, and each test task names its layer (R10). The copy is plain and has no job title (FR-010). Out-of-scope items (form fields, API, footer, home line) are not touched. |

### First-party options by capability (Principle IV)

| Capability | First-party option (Astro / Cloudflare / Fly.io) | Used? | Why / why not |
|------------|--------------------------------------------------|-------|---------------|
| Note text editable in the page file | Astro named slots (`slot="note"`) on an MDX child, read with `Astro.slots.has()` / `<slot name="note" />` (docs.astro.build/en/basics/astro-components/#named-slots, docs.astro.build/en/reference/astro-syntax/#astroslots) | **Used** | Keeps the Markdown in `contact.mdx`. Astro's JSX renderer routes MDX children by their `slot` prop. |
| Privacy paragraph inside the form | Astro default slot | **Used** | Lets page copy sit under a heading the component owns, inside its `<form>`. |
| Putting sections in MDX | Passing components to `<Content components>` (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content) | **Used, unchanged** | The registry already exposes `ContactForm`. No new section. |
| Two columns at 1024 px | Tailwind `lg:` breakpoint (theme default `64rem`) and grid utilities | **Used** | It is the design system (Technology Constraints). No custom media query or CSS file. |
| Icons | Astro SVG components (docs.astro.build/en/guides/images/#svg-components) with the existing `src/icons/*.svg` | **Used** | Already used by the footer, header and home intro. One new `mail.svg`. An icon package would be a new dependency for one glyph. |
| Social link list | Existing `socialNavigation` (`src/config/navigation.ts`) | **Used** | One list for the footer, home intro and contact note (FR-007). |
| Shown email address | Existing `site` config (`src/config/site.ts`), new `contactEmail` field | **Used** | Keeps the address out of component markup. The Worker's `CONTACT_DESTINATION` is a delivery setting, not display copy (R6). |
| Hosting and serving | Cloudflare Workers static assets | **Used, unchanged** | Nothing runs at request time. |
| Spam protection | Cloudflare Turnstile (existing, lazy-loaded) | **Used, unchanged** | No change to load timing or CSP. |
| Cloudflare data stores, Email Routing | — | Not needed | No data or delivery change. |
| Fly.io | — | Not applicable | The site does not run on Fly.io. Nothing here needs a server. |

## Project Structure

### Documentation (this feature)

```text
specs/052-contact-editorial-layout/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R10 (incl. test placement table)
├── data-model.md        # Phase 1: note, privacy notice, quick link, site config
├── quickstart.md        # Phase 1: how to validate end to end
├── contracts/
│   └── contact-page.md  # Phase 1: page file shape and rendered markup rows L1–L10, N1–N2
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
src/
├── components/sections/ContactForm.astro   # EDIT: note + default slots, grid wrapper, note column, quick links
├── config/site.ts                          # EDIT: SiteConfig.contactEmail
├── icons/mail.svg                          # NEW: decorative envelope (same style as github.svg)
└── content/pages/contact.mdx               # EDIT: note in <div slot="note">, privacy paragraph inside <ContactForm>

tests/
├── component/sections/ContactForm.test.ts  # EDIT: rows L1–L10, N1–N2 (render with named slots)
├── component/sections/helpers.ts           # EDIT: render() accepts named slots (keeps the default-slot signature)
├── unit/site/privacy-policy.test.ts        # EDIT: privacy policy and terms of use publish mailto:${site.contactEmail}
├── unit/content/site-pages.test.ts         # EDIT: contact.mdx note is in slot="note"; privacy link outside it
├── unit/site/fixture-posts.test.ts         # EDIT: "<ContactForm />" → "<ContactForm" (fixture is no longer self-closing)
├── fixtures/pages/contact-form.mdx         # EDIT: ASCII fixture note + fixture privacy paragraph
├── e2e/contact.spec.ts                     # EDIT: new "layout" describe (geometry, order, phone journeys)
└── e2e/visual.spec.ts-snapshots/           # REFRESH: contact-form-{desktop,phone}-{light,dark}-visual-{darwin,linux}.png
```

**Structure decision**: The existing single Astro project. The layout belongs to the section
component that already owns the form, so no new section, layout or route is added.

## Design notes

- **Wrapper**: `[data-contact]` keeps `not-prose mx-auto max-w-screen-lg`. When
  `Astro.slots.has("note")`, it adds `lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12`. The note
  is `section[data-contact-note].min-w-0.lg:col-span-5`, and the form column is
  `div[data-contact-form-column].min-w-0.mt-10.lg:col-span-7.lg:mt-0`. It contains the unchanged
  `<form>` and `#contact-success`. Without a note, the form and success panel render directly in the
  wrapper as today (N1).
- **Title**: already full width. `PageLayout` renders the `h1` in its own section above
  `#content-section`, so no layout change is needed (FR-001).
- **Slot text styles**: the wrapper is `not-prose`, so the slots use explicit utilities (R5). The
  note body uses the Now "open to" pattern; the privacy slot uses `text-sm` and the form's `link`
  classes, so the existing "privacy note" e2e test stays green.
- **Quick links**: a vertical list (`flex flex-col gap-3`), one link per line at every width. Each
  item is `inline-flex min-h-6 items-center gap-2 break-words` (at least 24 px tall, WCAG 2.5.8; the
  address may wrap at 320 px), with a `size-5` icon and the label, and the form's focus outline.
  The `icons` map is keyed by label, like `SiteFooter.astro`; a `socialNavigation` entry with no
  icon fails the component test (FR-007c).
- **Line length**: the note body gets `max-w-prose lg:max-w-none`, so stacked note text stays near
  65 characters a line; in the 5-part column it is already narrower (FR-017).
- **Spam-check width**: at 1024 px the form column is about 7/12 of the content width less the
  48 px gap (over 500 px), wider than the 300 px Turnstile widget, so it cannot clip (FR-017).
- **Script**: untouched. It finds elements by id, and no id changes.
- **Copy** (content file, for Don to confirm on the preview): one or two short paragraphs. They say
  Don is open to speaking and mentoring conversations about systems leadership and AI experiments,
  that he reads every message and replies by email within a few days, and give "Vancouver Island,
  BC — Pacific Time". The old first paragraph is deleted, and the privacy paragraph moves word for
  word.

## Existing tests affected

| Test | Effect |
|------|--------|
| `tests/e2e/contact.spec.ts` (all journeys, CSP, tab order from Name, honeypot, `?project=`) | Expected to pass **unchanged**. The ids and form order do not change. The tab-order test starts at Name, so the note links before it do not affect it. |
| `contact.spec.ts` "privacy note" | Expected to pass unchanged. `main p a[href='/privacy-policy/']` `.first()` is still the privacy paragraph, now first inside the form, and it stays underlined (R5). |
| `a11y.spec.ts` (`TEMPLATES` idle scans; "contact form states") | No edit. It covers the new note in both themes at both widths. |
| `geometry.spec.ts`, `no-js.spec.ts` | No edit. `/contact/` is in `TEMPLATES`. |
| `budget.spec.ts` | No edit. No script is added. |
| `tests/component/sections/ContactForm.test.ts` | Existing rows unchanged. They render with no slots, which is case N1/N2. New rows are added. |
| `tests/unit/content/site-pages.test.ts` "Contact note (FR-015)" | Passes unchanged, because the privacy paragraph stays in `contact.mdx`. |
| `tests/unit/site/fixture-posts.test.ts` | One assertion edited (`<ContactForm`). |
| `tests/unit/content/no-real-content-in-tests.test.ts` | Unaffected. The note has no heading and no external link in the page body. New e2e tests use `data-*` hooks and the component-owned "Before you write". |

## Visual baselines

- **Change (8 files)**: `contact-form-desktop-light`, `contact-form-desktop-dark`,
  `contact-form-phone-light` and `contact-form-phone-dark`, each `-visual-darwin.png` and
  `-visual-linux.png`. The `[data-contact]` element on the fixture page now holds the fixture
  note: two columns at 1280 px, stacked at 390 px. Refresh per
  `.claude/skills/_shared/visual-baselines.md`. Linux needs Docker Desktop
  (`test:visual:update:linux`). If `docker info` fails, ask Don to start it.
- **No other baseline should change.** The shell, sections, listing, project and post shots do not
  contain the contact form. `sections.mdx` is kept free of `<ContactForm` (`fixture-posts.test.ts`).

## Shared files and likely merge conflicts (sibling worktrees)

| File | This feature | Sibling risk | Handling |
|------|--------------|--------------|----------|
| `src/layouts/PageLayout.astro` | Not edited (read only: title and `#content-section` width) | **050-page-container-harmony** likely changes the `#content-section` container (dark background, padding, width) | No textual conflict. After 050 merges, merge `origin/main` and rerun the contact geometry e2e tests and the `contact-form` visual shots. A changed container width can move the baselines. |
| `tests/e2e/visual.spec.ts-snapshots/` | Refreshes `contact-form-*` | Any sibling refreshing shell or post baselines | Different files. Only a binary conflict on the same PNG needs a re-run. |
| `src/config/site.ts`, `src/config/navigation.ts` | Adds `contactEmail`; reads `socialNavigation` | **051-home-dual-cta** may touch the home intro links | Additive field; resolve by keeping both. |
| `tests/component/sections/helpers.ts` | Named-slot option | Other section work | Backward-compatible signature. |
| `.specify/feature.json` | Points at 052-contact-editorial-layout | Every sibling | Keep own value when merging main (known DIRTY-PR cause). |
| Feature number | `specs/052-contact-editorial-layout/` | Renumbered from 042 to 052 because sibling worktree 042-project-story-nav uses 042 | Resolved. |

## Complexity Tracking

No constitution violations, so this section is empty.
