# Quickstart: validating the doncoleman.ca story

Prerequisites: the worktree on `038-this-site-project-story`, Node from `.nvmrc` (run
`source ~/.nvm/nvm.sh && nvm use` in the same command as any `pnpm`, `astro` or `playwright`
call; see `CLAUDE.md` "Local toolchain"), and `uv` for the diagram fonts.

The rules being checked are in [contracts/story-content.md](./contracts/story-content.md); the
field values are in [data-model.md](./data-model.md).

## 1. Red first (research R7)

With the story file, `index.png` and a `pipeline.svg` that has labels but no font block yet:

```bash
pnpm exec vitest run --project unit tests/unit/site/diagram-fonts.test.ts tests/unit/content/no-real-content-in-tests.test.ts
```

Expected: the diagram test fails naming `pipeline.svg` and a missing character; the guard fails
naming `tests/build/indexing.test.ts` and the quoted title.

## 2. Green

```bash
pnpm run fonts:diagrams -- src/content/projects/images/doncoleman-ca/pipeline.svg
```

Then read the host from `setupConfig.zone` in `tests/build/indexing.test.ts` and re-run the two
tests from step 1. Expected: both pass; `pipeline.svg` is under 16 KB.

## 3. The story builds

```bash
pnpm run build
```

Expected: the build succeeds (C01 to C03, C07). `dist/projects/doncoleman-ca/index.html` exists
(a local build includes drafts) and is marked as a draft.

## 4. Local gate tier

Run the tier `scripts/ci/changed-paths.ts --base origin/main` selects (content tier expected),
under `perl -e 'alarm N; exec @ARGV'`. Ask Don before a full `pnpm run verify`. Expected: green,
including `projects.spec.ts`, `projects-no-js.spec.ts`, `seo.spec.ts`, `a11y.spec.ts`,
`budget.spec.ts` and `diagram-fonts.spec.ts` on the new story (it is now `pickedStory`). No
visual baseline changes.

## 5. Picture checks

```bash
sips -g pixelWidth -g pixelHeight src/content/projects/images/doncoleman-ca/index.png
```

Expected: 1600 x 1000, and no EXIF or text metadata (sharp re-encode).

## 6. Preview checks for Don (`[PREVIEW-CHECK]` in the PR body)

On `br-038-this-site-project-story-dcc-web-preview.drc-dev.workers.dev`:

- `/projects/` lists the story with its title, problem, themes, status and picture, marked Draft.
- `/projects/doncoleman-ca/` reads well in four parts; the Build part covers pipelines,
  constitution, the single-approval rule and the gate (C04, C11); the facts match the notes
  comment (C05).
- The Cadence link opens the Cadence story (C10).
- "Source code for doncoleman.ca" opens the public repository in a signed-out window (C06, SC-004).
- The screenshot and diagram look right in light and dark themes.

After merge, production `/projects/` still shows the five published stories and not this one
(SC-001).
