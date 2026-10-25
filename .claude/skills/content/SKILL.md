---
name: content
description: Make a content update — an edit to a page, post, project story, career entry, reading path, Now or assessment file under src/content, or the schema or section component it needs — on a branch, check the change tier, run the cheap local checks and open a PR with auto-merge, CI as the gate. Use for copy, frontmatter, new or retired entries, images and small schema fields; not for a new visible design or layout (/tweak), a new feature (/deliver), maintenance with no visible change (/chore) or a bug (/squash).
argument-hint: "Content change description, or a GitHub issue reference (#42, 42, or issue URL)"
user-invocable: true
disable-model-invocation: false
---

# /content — content updates

You make the edit yourself, in this context. There is no spec, plan or tasks, and a pure content
edit adds no test: the schemas, the build-time checks and the content-derived tests already cover
it (`docs/testing.md` "Real content in tests"). CI is the gate.

**Input:** `$ARGUMENTS` is the change description or a GitHub issue reference. If empty, ask for
it. For an issue, run `gh issue view <n> --json number,title,body,labels`; the PR then closes it.

## When to use

Content is user-visible, so this is not `/chore`; it is lighter than `/tweak`. Stop and hand off
as soon as any of these is true, naming the reason:

- A new visible design or layout: new CSS, a new section component or a template change. Use `/tweak`.
- A new collection, route or page type, or anything `/tweak`'s triage gate would send to `/deliver`. Use `/deliver`.
- A defect (something renders wrong or breaks). Use `/squash`.

A new schema field, a new section component prop or a check in `src/lib` that the edit needs is
still `/content`; see "Code and schema changes".

## Collection guide

All paths are under `src/content/`; the loaders are in `src/content.config.ts`. One file-format
rule covers every collection: a file with a body is `.mdx`, and a file without one is `.yaml`. A
file with the other extension (`.md`, or `.yml`) fails the build with a message that names it and
says what to rename it to (`src/lib/content/file-format.ts`). The pages folder holds only `.mdx`,
and that includes the landing files `writing.mdx` and `projects.mdx`, which have no body. #202 will
merge the three small site-data collections (Now, reading paths, assessment), so re-read the schema
before trusting a row. Every schema is strict: an unknown or misspelled key fails the build.

| Collection | Files | ID | Rules and where they are enforced | Author doc |
|---|---|---|---|---|
| `pages` | `pages/**/*.mdx` (`.md` is rejected), except `writing` and `projects` | Address from the path: lower-case letters, digits, hyphens; `index.mdx` is `/` | `title` and `description` required; `visible` (default true) and `draft` (default false); `nav` puts it in the header or footer, one position per menu (`lib/content/navigation.ts`); the home page cannot be `visible: false`; no two files make one address; no route in `src/pages/` may own the address. Schema `schemas/page.ts`; checks `lib/content/addresses.ts` and `page-flags.ts`; section components in the body are prop-checked by `src/components/sections/{schemas,validate}.ts` | `docs/pages.md` |
| `landing` | `pages/writing.mdx`, `pages/projects.mdx` | `writing`, `projects` | Menu settings only (`title`, header `nav`); the body must be empty (`assertLandingBody`). The pages themselves are code routes | `docs/pages.md` "Landing files" |
| `posts` | `posts/*.mdx` | File name without extension | `.md` is rejected, no sub-folders, a few names are reserved (`all`, `topics`, series ids) (`assertPostFiles`); `title`, `summary`, `date` (YYYY-MM-DD, a real day, checked on the raw text by `post-dates.ts`), at least one topic, no duplicate topics, at most one series; `updated` not before `date`; `draft`, `featured`. Schema `schemas/post.ts`. `sample-everything.mdx` is the draft sample | `docs/posts.md`, `VOICE.md` |
| `projects` | `projects/*.mdx` directly in the folder; `_`-prefixed files (`_template.mdx`) are not projects | File name, up to 64 characters of lower-case letters, digits, hyphens | `problem` is one sentence of at most 140 characters; 1 to 4 `themes`; `status`; `visual`; `replacedBy` only with `status: retired`; `demo` or `standIn`, not both; the story body is Problem, Options, Build and Lessons, with the Options table. Schema `schemas/project.ts`; story shape `lib/content/project-story.ts` | `docs/projects.md` |
| `career` | `career/*.yaml` (`.yml` is rejected) | File name | `role`, `organization`, `start` and `end` as `YYYY-MM` (`end` may be `present`), `scope`; optional categories (leadership, awards, volunteer) and post references that must exist and not be drafts; the newest step is the current role: `end: present` and no `nextMove`. Schema `schemas/career.ts`; cross-file rules `lib/content/career.ts`. Rendered by `CareerTimeline` on About | none; the schema is the reference |
| `readingPaths` | `reading-paths/*.yaml` (`.yml` is rejected) | File name | `title`, one-sentence `description` ending in a full stop, `position` 1 to 4, 1 to 5 `items` each `post: <slug>` or `project: <slug>`; cross-file rules (missing, duplicate, the four-path limit) in `lib/content/reading-paths.ts`. Rendered by `StartHere` on the home page | none |
| `now` | `now/now.mdx` (`now.md` is rejected) | `now` | `updated` (a real day, not in the future), four one-line topics (`workingOn`, `reading`, `mbaResearch`, `aiExperiments`, up to 200 characters); the body is one paragraph linking to `/contact/`. Schema `schemas/now.ts`. Rendered by `Now` on the home page | none |
| `assessments` | `assessments/*.yaml` (`wayfinder.yaml`; `.yml` is rejected) | File name; a post names it in its components | Exactly five shifts of three statements, five scale labels (first "Rarely", last "Almost always"), unique `id` and `anchor`. Schema `schemas/assessment.ts` | `docs/posts.md` "Assessment components" |

Rules that are not in a schema: the job title appears only on the About page, so describe what
Don leads elsewhere (`tests/unit/content/job-title-only-on-about.test.ts`). A site section
component name or prop you are unsure of is listed in `docs/pages.md` "Components".

## Images

State today. `posts/images/` and `pages/images/` are flat folders; `projects/images/<slug>/`
holds one folder per project. A path in front matter starts with `./images/` and is relative to
the file. A missing file fails the build with the file named (`lib/content/images.ts`), and an image in front matter needs alt text. Diagrams with text follow `docs/projects.md` "Text in a diagram"
(`pnpm run fonts:diagrams`). #201 will give all three one layout, so check the doc for the
collection you are editing before adding a file.

## Where the rules live

State today. A rule can sit in any of three places, so when an edit fails or you need to know
what is allowed, look in all of them: the schema (`src/content/schemas/<x>.ts`), the build-time
checks (`src/lib/content/*.ts`, run from `generateId` in `src/content.config.ts` or, for some, by the readers and routes at build time), and the reader
that assembles the collection (`src/lib/<x>.ts`, for example `now.ts`, `career.ts`,
`reading-paths.ts`), plus the rendering component. #203 will put each collection's rules in one
module. Two test guards bind a content edit:

- Tests never name real content. They read `src/content/**` through `tests/helpers/content.ts`
  (`docs/testing.md` "Real content in tests"; guard `tests/unit/content/no-real-content-in-tests.test.ts`).
  So publishing, retiring or renaming an entry, or flipping `draft`, needs no test edit. Do not
  add one, and never re-date the fixture posts.
- Do not mention removed section components in guides (`tests/unit/site/docs-content-structure.test.ts`).

## Flow

1. **Preflight.** `git status` must be clean and you must be on `main` or in a worktree
   (`git remote get-url origin` must be a GitHub remote). Anything else: stop and tell the user.
2. **Branch** `content/<slug>` from `main` (a short kebab-case slug; no `specs/` or `.specify/`
   directory is made).
3. **Edit** using the guide above and the author doc for the collection. Keep to the voice
   rules in `VOICE.md` for prose. Commit with a conventional message (`docs(content): ...` for an edit, `feat(content): ...` for a new entry).
4. **Gate** (next section).
5. **PR.** Read `.claude/skills/_shared/open-pr.md` and follow it exactly. The body says what
   changed and where to see it on the preview, includes `Closes #<n>` for an issue, and lists
   any `[PREVIEW-CHECK]` items (`.claude/skills/_shared/preview-check.md`).
6. **After the merge,** clean up as `CLAUDE.md` "Merging" says.

## Gate

Read `.claude/skills/_shared/verify-gate.md`. It applies, with one difference. When the diff
changes no code (nothing outside `src/content/`, no file under `src/content/schemas/`, and no
test), commit, run `git fetch origin` and
`node scripts/ci/changed-paths.ts --base origin/main` as that file says, then run, whatever tier
it prints:

```
pnpm run lint:secrets && pnpm run test:unit && pnpm run test:build:content
```

instead of the full `pnpm run verify`, which needs no go-ahead from Don here. `test:build:content`
builds the site itself: `indexing.test.ts` runs `astro build` on the real content in a main and a
preview environment, so no separate `pnpm run build` is needed. It also runs the navigation,
local-site and project-template build tests. Follow the Local toolchain section of `CLAUDE.md`
for the pnpm calls (node version, `perl` alarm for a long run). Why this is enough: copy, posts and
stories cannot move a visual baseline, because the visual project builds the fixture site. One
exception: the header, footer, open mobile menu and not-found shots are taken on the real site, so
a menu change (adding, removing or moving a page's `nav`, a `nav.label`, or the title of a menu
page) moves them. A `visible` or `draft` flip does not, because that build keeps hidden and draft
pages in the menus. That case needs the baseline refresh in
`.claude/skills/_shared/visual-baselines.md`, which runs the Playwright image in `container` or Docker, so
raise it with Don before the PR.

State today: a YAML or `.md` collection prints `tier=full` and pays the full CI gate, though the
diff changes no code. #199 will add a content-only tier for those collections. Until then, push
and let CI run the tier it computes. CI is the gate and auto-merge waits for a green `verify`.

## Code and schema changes

When the edit needs code outside `src/content/` (a section component, a reader or check in
`src/lib`) or a schema change:

1. Write the failing test first at the cheapest layer (`docs/testing.md` "Where a test goes"),
   and see it fail.
2. Make the change, then run `pnpm run verify:quick` under the `perl` alarm.
3. That diff runs the full tier. `_shared/verify-gate.md` applies unchanged, including Don's
   go-ahead before the full `pnpm run verify`.

If the change turns into a new visible design or layout, stop and hand off to `/tweak`. If it
becomes a new feature, hand off to `/deliver`.
