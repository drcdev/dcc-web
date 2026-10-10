# Data model: Docs-only verify gate

No stored data. The "entities" are the values passed between `scripts/ci/changed-paths.ts`,
the workflow and `scripts/ci/verify-needs.ts`.

## Documentation file (FR-001, FR-002)

A changed path `p` is a documentation file when all hold:

- `p` does not contain `..`, does not start with `/`, does not contain `\`;
- `p` starts with `docs/`;
- `p` ends with `.md` (case-sensitive; `.MD`, `.mdx`, `.markdown` are not documentation).

Examples: `docs/testing.md`, `docs/design/blog.md` are documentation. `docs/design/x.png`,
`docs/x.mdx`, `README.md`, `src/docs/a.md`, `docs`, `docs/../src/a.md` are not.

Predicate: `isDocs(path: string): boolean`, exported beside `isSkipSafe` and `isContentOnly`.

## Change tier (FR-003, FR-004, FR-009 to FR-011)

Enumeration: `"skip-safe" | "docs" | "content-only" | "full"`.

`decide(input)` with `input = { event, files }`:

| Order | Condition | Tier |
|---|---|---|
| 0 | `event` is neither `pull_request` nor `push` | `full` |
| 0 | `files === null` (diff not computed) | `full` |
| 0 | no non-blank file after trimming | `full` |
| 1 | every file `isSkipSafe` | `skip-safe` |
| 2 | every file `isSkipSafe` or `isDocs` (and, by row 1 failing, at least one `isDocs`) | `docs` |
| 3 | every file `isSkipSafe`, `isDocs` or `isContentOnly` | `content-only` |
| 4 | otherwise | `full` |

Row 3 now admits documentation files, so docs plus content gives `content-only` (FR-004); before
this slice a docs file would have made that change `full`. The skip-safe and content-only
predicates themselves do not change (FR-011).

`ChangeDecision` becomes `{ tier: Tier; reason: string }`. The `reason` names the first file
that forced `full`, or the counts per kind, and is logged with the tier and the changed files
(FR-012). `toOutput(decision)` renders `tier=<value>\n` for `GITHUB_OUTPUT`.

## Changed-file collection (FR-009)

`collectFiles({ event, before }, git)` where `git(args)` returns stdout or throws:

| Event | Steps | Result on any failure |
|---|---|---|
| `pull_request` | `git diff --name-only --no-renames HEAD^1 HEAD` | `null` |
| `push` | validate `before` (40 hex, not all zeros); `git fetch --no-tags --depth=1 origin <before>`; `git diff --name-only --no-renames <before> HEAD` | `null` |
| other | none | `null` |

`null` maps to `full` in `decide`.

## Needs decision (FR-008, FR-010)

Input: `toJSON(needs)` for `changes`, `static`, `build-tests`, `e2e`.

Passes only when:

1. all four jobs are present with a string `result`;
2. `changes.result == "success"` and `changes.outputs.tier` is one of the four tiers;
3. `static.result == "success"`;
4. for each of `build-tests`, `e2e`: `result == "success"`, or `result == "skipped"` and tier
   is `skip-safe` or `docs`.

Anything else is a problem line; any problem fails `verify`. An unknown tier is reported as
`job "changes" output tier is "<value>", expected one of skip-safe, docs, content-only, full`.

## Step conditions per tier

| Step / job | skip-safe | docs | content-only | full / unset |
|---|---|---|---|---|
| `static`: secretlint | run | run | run | run |
| `static`: lint, type-check, worker tests | skip | skip | run | run |
| `static`: unit and component tests | skip | run | run | run |
| `build-tests` job | skip | skip | run | run |
| `build-tests`: `test:build` | — | — | skip | run |
| `build-tests`: `test:build:content` | — | — | run | skip |
| `e2e` job (incl. preview check on PRs) | skip | skip | run | run |
| `verify` | run | run | run | run |
