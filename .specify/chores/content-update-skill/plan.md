# Chore plan: content-update-skill

Branch: `chore/content-update-skill`, from `main` at 3433e35f.
No issue closes with this PR. Related follow-ups, each of which updates a named section of the
new skill when it lands: #199 (content-only tier for data collections), #200 (one file-format
rule), #201 (one image folder layout), #202 (merge the small site-data collections), #203 (one
module per content collection).

## Goal

Content edits (anything under `src/content/`: the `.mdx`, `.md` and `.yaml` entries, the
schemas, and the section components those entries use) have no pipeline of their own today.
`/tweak` is too heavy for a copy edit (spec, plan, tasks, full local gate) and refuses schema
changes, and `/chore` is wrong because a content edit is user-visible. This chore adds a
`/content` skill at `.claude/skills/content/SKILL.md`. For a pure content edit it runs: branch,
edit, changed-paths tier check, the cheap local checks, PR with auto-merge, and CI as the gate.
It writes no spec and adds no test, because the schemas, the build-time checks and the
content-derived tests already cover content. When the edit needs code outside `src/content/`
or a schema change, the skill does that work itself, test-first, and the diff runs the full
tier. It hands off to `/tweak` for a new visible design or layout and to `/deliver` for a new
feature. The skill also holds a short per-collection guide and a "where the rules live" map,
each describing today's state with a pointer to the open streamlining issue that will change
it. The four existing pipeline skills keep working as before. Only their routing descriptions
and the shared-file "Included by" lines gain a pointer to `/content`.

## Acceptance

1. `.claude/skills/content/SKILL.md` exists. Its frontmatter has the same shape as
   `tweak/SKILL.md`: `name: content`, a `description` containing "Use for … not for …",
   `argument-hint`, `user-invocable: true`, `disable-model-invocation: false`.
2. The skill has these sections, found with `grep -n '^## '`: **When to use** (triage and
   routing), **Collection guide**, **Images**, **Where the rules live**, **Flow**, **Gate**,
   **Code and schema changes** (the escalation rule). Each of these names its open issue with
   "today" wording, so a reader can tell current state from planned state: Gate names #199,
   Collection guide names #200 and #202, Images names #201, Where the rules live names #203.
3. Routing: the description of `tweak/SKILL.md` and of `chore/SKILL.md` each gain one clause
   pointing content edits to `/content`. The `/content` description names `/tweak`, `/chore`
   and `/deliver` in its "not for" clause. `CLAUDE.md` "Orchestration skills" lists `/content`
   in one sentence.
4. No `_shared` wording is restated. The skill reads `_shared/open-pr.md` at the point of use
   and states its narrower local checks as a difference from `_shared/verify-gate.md`, by
   reference. Check with grep: none of `gh auth switch --user drc-agents`,
   `**Inner loop and gate.**` or `runs secret lint, lint, type check` occurs in
   `content/SKILL.md`.
5. `_shared/verify-gate.md` and `_shared/open-pr.md` each name `/content` in their
   "Included by" line. verify-gate.md also gets one clause saying `/content` narrows the local
   checks for content edits, as its Gate section states. No other wording in `_shared/` changes.
6. Every rule the Collection guide gives (file location, extension, ID rule, key constraint,
   enforcing check) matches `src/content.config.ts`, `src/content/schemas/*.ts` and
   `src/lib/content/*.ts` at the time of writing. The review checks a sample of these.
7. The tests that read `.claude/skills/` stay green with no edits:
   `tests/unit/site/docs-content-structure.test.ts` (no `TextBlock` or `Offerings` in any
   guide), `tests/unit/ci/changed-paths.test.ts` (drift guard) and
   `tests/unit/setup/skill-behaviour.test.ts`. Run with `pnpm run test:unit`.
8. Tier of the PR: every changed file is a non-code file under `.claude/skills/`, `CLAUDE.md`,
   a `.md` under `docs/`, or under `.specify/`. So `node scripts/ci/changed-paths.ts --base
   origin/main` prints **`tier=docs`**, and the local gate is
   `pnpm run lint:secrets && pnpm run test:unit` (per `_shared/verify-gate.md`). No full
   `pnpm run verify` and no visual baseline change.

## Scope

**In:** W1 to W3 below.

**Out:**

- Issues #199 to #203. This PR neither builds nor partly builds any of them. The skill describes
  today's state and points to each issue.
- Any change to `scripts/ci/changed-paths.ts`, the tiers, CI, tests, schemas, content or
  components.
- Author docs for the YAML collections. The skill's Collection guide covers them briefly. A
  `docs/` page for them is a possible follow-up, noted in the PR body.
- Rewording `/tweak`'s triage gate. It still sends a schema change to `/deliver`. `/content`
  takes schema changes that come up while editing content (see W1 "Code and schema changes").
  The description pointer is enough for routing.

## Constitution Check

- **I. Test-First:** W1 to W3 are agent instructions and docs, so each takes
  `no behaviour: n/a`. The skill keeps Principle I for the work it runs. A pure content edit
  adds no behaviour: the schemas, the `generateId` checks and the content-derived tests (#55)
  already test it, and publishing needs no test edit. Code or schema changes are test-first at
  the cheapest layer ("Where a test goes", `docs/testing.md`).
- **II. Automated Release Gate:** nothing is weakened. CI recomputes the tier and stays the
  gate. The skill skips only the *local* full `pnpm run verify` for content edits, which
  `docs/testing.md` already treats as advisory ("CI recomputes the tier and remains the gate").
  A content-only diff still runs the whole CI gate except the build files that never read real
  content.
- **III. Human Review of Every Change:** every `/content` PR opens from `drc-agents` and arms
  auto-merge through `_shared/open-pr.md`, and waits for Don's approval. This PR does the same.
- **IV. First-Party Before Custom:** uses Claude Code's existing skill format (`SKILL.md` with
  frontmatter), the same as the other pipelines. No tool usage changes.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** reinforced. The skill edits files in Git and relies on schema
  validation failing the build.
- **VII. Private Data:** unaffected. No secrets, no `.env` reads.
- **VIII. Cloudflare Best Practices:** unaffected.
- **IX. Cost Ceiling:** unaffected. It may cut local machine load. CI minutes are unchanged.
- **X. Accessible, Fast and Private:** unaffected. The skill hands a new visible design or
  layout to `/tweak`, which runs the a11y and visual checks.
- **XI. Spec Kit Workflow:** this chore is on `chore/content-update-skill` with its plan in
  `.specify/chores/content-update-skill/`. The skill's branch name is a judgment call (J1).

## Work items

### [x] W1 Write `.claude/skills/content/SKILL.md`

Files: `.claude/skills/content/SKILL.md` (new).
Test: `no behaviour: n/a (agent instructions; the existing skill-reading unit tests must stay green)`.
Layer: unit (existing `docs-content-structure.test.ts` and `changed-paths.test.ts` only).

Keep it concise (target under about 180 lines). Copy tweak's frontmatter shape. Description
draft: "Make a content update — an edit to a page, post, project story, career entry, reading
path, Now or assessment file under src/content, or the schema or section component it needs —
on a branch, check the change tier, run the cheap local checks and open a PR with auto-merge,
CI as the gate. Use for copy, frontmatter, new or retired entries, images and small schema
fields; not for a new visible design or layout (/tweak), a new feature (/deliver), maintenance
with no visible change (/chore) or a bug (/squash)." `argument-hint`: "Content change
description, or a GitHub issue reference".

Sections:

1. **When to use.** Content is user-visible, so not `/chore`. It is lighter than `/tweak`: no
   spec, plan or tasks. Hand off as soon as any of these is true: a new visible design or
   layout, meaning new CSS, a new section component or a template change (`/tweak`); a new
   collection, route or page type, or anything `/tweak`'s triage would send to `/deliver`
   (`/deliver`); a defect (`/squash`). Issue input: fetch it with `gh issue view`, and the PR
   closes it.
2. **Collection guide.** One compact table or list per collection: folder and glob,
   extension(s), ID rule, the key rules and the build check that enforces each, the component
   or page that renders it, and the author doc. Verify every cell against
   `src/content.config.ts`, `src/content/schemas/*.ts` and `src/lib/content/*.ts`. Do not
   copy from this plan. Starting facts from exploration:
   - `pages`: `pages/*.mdx` minus `writing`/`projects`, section components inside the `.mdx`
     with prop checks from `src/components/sections/{schemas,validate}.ts`; draft/visible flags;
     home must be visible; job title only on About (memory rule, `src/lib/content` check if
     one exists). Doc: `docs/pages.md`.
   - `landing`: `pages/writing.mdx`, `pages/projects.mdx`, menu settings only, body must be empty.
   - `posts`: `.mdx` only (`.md` rejected), date validity, images flat in `posts/images/`,
     `sample-everything.mdx` is a draft sample. Docs: `docs/posts.md`, `VOICE.md`.
   - `projects`: `.mdx`, `_`-prefixed files are templates (`_template.mdx`), images in
     `projects/images/<slug>/`, story shape Problem/Options/Build with the options table.
     Doc: `docs/projects.md`.
   - `career` (7 `.yaml`, About page `CareerTimeline`), `reading-paths` (`.yaml` or `.yml`,
     `StartHere`, 4-path limit), `now` (`now.md`, the only `.md` collection, home `Now`
     section, date check), `assessments` (`wayfinder.yaml`). No author docs. The schema is
     the reference.
   - Today's state, with pointers: mixed extensions (#200), three small site-data collections
     (#202).
3. **Images.** Today: `posts/images/` and `pages/images/` are flat, `projects/images/<slug>/`
   is per entry. Images must exist (build check) and are referenced relatively. Pointer: #201.
4. **Where the rules live.** For each collection: the schema (`src/content/schemas/<x>.ts`),
   the build-time checks (`src/lib/content/*.ts`, run from `generateId` in
   `src/content.config.ts`), the reader (`src/lib/<x>.ts`) and the rendering component.
   Note that a rule can sit in any of the three. Pointer: #203. Also the test guards a content
   edit must respect: tests never name real content (`docs/testing.md` "Real content in
   tests", the literal guard in `tests/unit/content/no-real-content-in-tests.test.ts`), and
   publishing or retiring an entry needs no test edit.
5. **Flow.** Preflight (clean tree on `main`, or a worktree), branch `content/<slug>` (J1),
   edit, commit, then the Gate, then read and follow `_shared/open-pr.md` (by reference). The
   PR body says what changed and where to see it on the preview, plus any `[PREVIEW-CHECK]`
   items (`_shared/preview-check.md`, by reference). Clean up after the merge per `CLAUDE.md`
   Merging.
6. **Gate.** Read `_shared/verify-gate.md`. It applies except for one difference, stated once:
   when the diff changes no code (no schema, `src/content.config.ts`, `src/lib`, component or
   test), run `node scripts/ci/changed-paths.ts --base origin/main` as that file says, then
   `pnpm run lint:secrets && pnpm run test:unit && pnpm run test:build:content` in place of
   the full `pnpm run verify`, whatever tier it prints. CI is the gate. Why: content cannot
   move visual baselines, because the visual project builds the fixture site. Today the YAML
   and `.md` collections print `tier=full` and pay the full CI gate. Pointer: #199. Follow the
   Local toolchain section of `CLAUDE.md` for the pnpm calls. Implementer: confirm that
   `test:build:content` runs its own build. If it does not, add `pnpm run build` before it.
7. **Code and schema changes.** When the edit needs code outside `src/content/` (a section
   component, a `src/lib` reader or check) or a schema change: write the failing test first at
   the cheapest layer per `docs/testing.md` "Where a test goes", see it fail, make the change,
   run `pnpm run verify:quick`. That diff runs the full tier, and `_shared/verify-gate.md`
   applies unchanged, Don's go-ahead included. If the change turns into a new visible design
   or layout, stop and hand off to `/tweak`. If it becomes a new feature, hand off to
   `/deliver`.

### [x] W2 Routing pointers and shared-file lines

Files: `.claude/skills/tweak/SKILL.md`, `.claude/skills/chore/SKILL.md` (frontmatter
`description` only), `.claude/skills/_shared/verify-gate.md`, `.claude/skills/_shared/open-pr.md`
("Included by" line only), `CLAUDE.md` ("Orchestration skills": one sentence), `docs/testing.md`
("Local tier" paragraph: one clause saying `/content` narrows the local checks for code-free
content edits, as its Gate section states).
Test: `no behaviour: n/a (routing text and docs)`.
Layer: unit (existing skill and docs readers stay green).

- tweak description: add "not for a content-only edit (/content)" to its "not for" list.
- chore description: add "a content update (/content)" to its "not for" list.
- verify-gate.md: "Included by `/deliver`, `/tweak`, `/squash`, `/chore` and `/content`
  (whose Gate section narrows the local checks for code-free content edits)." Do not change
  anything else in the file.
- open-pr.md: add `/content` to the "Included by" line.
- CLAUDE.md: one sentence after the `/chore` sentence: `/content` handles edits under
  `src/content/` with no spec and CI as the gate, and uses the same `_shared/` files. Where it
  says "the four pipelines" and that would now be wrong, change the count.

### [x] W3 Local gate and record

Files: none new (the review report is written by the review phase).
Test: existing. Run `git fetch origin && node scripts/ci/changed-paths.ts --base origin/main`
and expect `tier=docs`. Then `pnpm run lint:secrets && pnpm run test:unit` under the `perl`
alarm (CLAUDE.md Local toolchain).
Layer: unit.

Also run the Acceptance 4 greps and `grep -rn "TextBlock\|Offerings" .claude/skills/content`
(expect none).

## Docs citations

No Astro, Cloudflare, Vitest, Playwright or GitHub Actions usage changes, so there is nothing
to cite under Principle IV. The skill format follows the existing pipeline skills in
`.claude/skills/`.

## Judgment calls

- **J1: branch name `content/<slug>`.** Principle XI forbids custom conventions on top of Spec
  Kit for *feature* work. `/chore` and `/squash` already use the same `<type>/<slug>` shape
  (`chore/<slug>`, `bugfix/<slug>`) for non-feature work, so `content/<slug>` follows existing
  repository practice rather than adding a new kind of convention. It has no numbered feature
  branch and no `specs/` or `.specify/` directory, because there is no spec or plan artifact.
  Nothing in `scripts/ci` or `.github/` reads the branch prefix. `previewAlias`
  (`src/lib/site-origin.ts`) turns `content/foo` into the alias `content-foo`, which is valid
  and needs no `br-` prefix.
- **J2: the local gate for code-free content edits is the same whatever the tier.** Today a
  YAML edit prints `tier=full`, though it changes no code. Running the full local verify for
  it would go against Don's "testing should be minimal unless code outside src/content is
  changed". The skill keys the local checks on "code changed or not" and leaves the CI tier as
  it is (#199 will narrow CI).
- **J3: smallest shared-file change.** verify-gate.md gets the `/content` name and one
  parenthetical in its existing "Included by" line, not a new section. The difference itself
  is stated only in the skill.
- **J4: docs/testing.md gets one clause**, because its "Local tier" paragraph says the
  pipelines run the full verify for content-only. Without the clause it would contradict the
  skill. Same tier (docs), no extra cost.

## Risks

- **Rule drift in the Collection guide.** A hand-written summary of schema rules can go stale.
  Mitigation: each entry names the file that enforces the rule, and the follow-up issues
  (#200 to #203) each name the section they update. Keep entries short so they point to the
  rule rather than restate it.
- **Under-testing a code-free content edit locally.** A text collision with a fixture
  assertion (`docs/testing.md` residual risk) shows only in CI. This is accepted: CI is the
  gate, and auto-merge waits for green `verify`.
- **Wrong routing between /tweak and /content.** A copy change could fit either. The
  descriptions state the line (no design or layout change means `/content`), and `/content`
  hands off as soon as CSS, a new component or a template change appears.
- **The removed-sections guard** (`docs-content-structure.test.ts`) fails if the skill names
  `TextBlock` or `Offerings`, even as history. Do not mention them.

## W3 record

Tier printed: `tier=docs` (6 documentation files, 2 skip-safe). `pnpm run lint:secrets` passed;
`pnpm run test:unit` passed (189 files, 2878 tests). Acceptance 4 greps and the
`TextBlock|Offerings` grep found nothing in `.claude/skills/content`. No full `pnpm run verify`
was run (not needed for tier=docs). The skill's claim that a YAML-only edit prints `tier=full`
holds: `decide()` returns full for `src/content/career/a.yaml`, `src/content/now/now.md` and
`src/content/reading-paths/p.yml`, because `CONTENT_FILE` and `CONTENT_IMAGE` accept only `.mdx`
and images under pages/posts/projects, and neither skip-safe nor docs rules match `src/content`.
