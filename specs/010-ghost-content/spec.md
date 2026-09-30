# Feature Specification: Ghost content migration

**Feature Branch**: `010-ghost-content`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Use the Ghost Admin API to pull the pages and posts from
doncoleman.ca and recreate them in this project."

## Context

Until this feature, every page carried placeholder copy (spec 003) and the blog held only the
four `sample-*` draft posts (spec 008). Don's current site runs on Ghost at
https://www.doncoleman.ca with 4 published posts and 7 pages. This feature copies that content
into the repository as MDX, once, with the official `@tryghost/admin-api` package run outside
the repository (no dependency is added; Constitution Principle III). The Admin API key lives
in the gitignored `.env` as `GHOST_ADMIN`.

## Decisions (Don, 2026-09-30)

| # | Question | Decision |
|---|---|---|
| D1 | Privacy policy, terms of use and technology: spec 003 already fetched and adapted these from Ghost | **Merge what still applies.** Keep the adapted copy; add the Ghost sections that are still true for this site. Every fact pinned by `tests/unit/content/launch-content.test.ts` and `tests/unit/site/privacy-policy.test.ts` stays. This extends the list of claims in spec 003 FR-022. |
| D2 | Cookie policy and contact thank-you pages | **Neither is recreated.** Spec 003 FR-022 folds the cookie policy into the privacy policy and reserves `/cookie-policy/` as not found; the contact form confirms inline, so a thank-you page would be linked from nowhere. Their text is kept in the pull request for reference. |
| D3 | Ghost tags (Drift, Convergence, AI, Vibe Coding, Ghost Themes, News, ...) | **Map to the existing four topics**; the taxonomy in `src/config/topics.ts` is unchanged. |
| D4 | About page draft flag | **About is live copy** (`draft: false`): it carries Don's own wording from Ghost, so the placeholder notice goes. This supersedes spec 003 FR-021 for About. The legal pages stay drafts. |
| D5 | The Wayfinder post was members-only after its marker (the printable PDFs) | **Publish publicly.** The two PDFs are served from `/files/`. |
| D6 | Sentences about newsletters, subscribing and comments (Ghost features) | **Reword minimally**: "newsletter" becomes "series" on the About page; the two subscribe lines and the comment invitation in "Starting something new" become "follow along here" and a link to the contact page. Every edit is listed in the pull request. |

## Content mapping

### Posts (`src/content/posts/`, slugs kept exactly as on Ghost)

| Ghost post (date) | Topic | Featured |
|---|---|---|
| The Systems Leadership Wayfinder: Five Mindset Shifts for Leading Complex Change (2025-08-27) | healthcare-leadership | yes |
| Building Focus Pocus: What I Learned About AI Coding and Integration (2025-08-16) | agentic-ai | yes |
| Self-contained development for Ghost themes (2025-08-07) | technology-teams | no |
| Starting something new (2025-03-15) | healthcare-leadership | yes |

- `summary` is the Ghost custom excerpt (trimmed to two sentences where longer); `date` is the
  Ghost publication date; `featured` follows Ghost. No `updated` date is carried over.
- Feature images and body images are the Ghost originals, copied to
  `src/content/posts/images/` with a post prefix. Ghost had no alt text, so every `alt` was
  written during the migration and needs Don's review.
- Ghost cards map to the site's own constructs: image cards to `Figure`, code cards to fenced
  code with a caption, bookmark cards to a plain link plus description, file cards to links to
  `public/files/`, blockquotes to Markdown quotes. Members-only markers are removed (D5).
- Internal links `https://www.doncoleman.ca/<year>/<slug>/` become `/writing/<slug>/`.
  There are no redirects from the old addresses (spec 008 rule; a follow-up if wanted).

### Pages (`src/content/pages/`)

| Ghost page | Result |
|---|---|
| About Drift & Convergence | `about.mdx`: body replaced with the Ghost copy (D6), feature image added, `draft: false` (D4). Title stays "About". |
| Contact | `contact.mdx`: the one Ghost sentence added as the opening paragraph; the form and its wording are unchanged. |
| Privacy Policy, Terms of Use, Technology | Merged per D1; still drafts. |
| Cookie Policy, Contact - Thank you! | Not recreated (D2). |

## Requirements

- **FR-001**: Every published Ghost post exists as `src/content/posts/{ghost-slug}.mdx`, builds
  under the strict post schema and is visible on the writing pages, its topic page and the feed.
- **FR-002**: Every post keeps Don's wording; the only edits are those in D6 and structural
  conversion.
- **FR-003**: Every image the posts and the About page use is committed beside the content;
  nothing is loaded from doncoleman.ca or Unsplash at run time.
- **FR-004**: The two Wayfinder PDFs are served from `/files/` and linked from the post.
- **FR-005**: Tests that described the placeholder-only site now describe the real content
  without weakening any check; fixture-site builds leave the real posts out unless a test asks
  for them, so the listing and pagination tests stay deterministic.
- **FR-006**: The visual baselines of the pages whose appearance changed are refreshed on both
  platforms.

## Success Criteria

- **SC-001**: `pnpm run verify` passes locally and in CI with the real content.
- **SC-002**: Opening `/writing/` on the preview shows the four Ghost posts alongside the sample
  drafts, and each post page renders every image, code block, quote and PDF link.
- **SC-003**: `/about/` shows Don's copy with no draft notice; the legal pages still show one.

## Follow-ups (out of scope)

- Redirects from the old Ghost addresses (`/drift/2025/...`, `/convergence/2025/...`,
  `/news/2025/...`, `/2025/...`) to `/writing/...`.
- Don to review the generated alt text and the reworded sentences (D6).
- `[PREVIEW-CHECK]` that the PDFs open in the browser under the site's response headers.
