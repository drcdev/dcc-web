# Review report: svg-csp-link-schema (issue #95)

Base: `87a8389` (local `main` was stale, so every diff is `git diff 87a8389...HEAD`).

## Verdict

W1–W5 done as planned, nothing beyond. The diff touches only `public/_headers`,
`tests/unit/site/headers.test.ts`, `src/content/schemas/shared.ts`,
`src/components/sections/schemas.ts`, `tests/unit/content/page-schema.test.ts`,
`tests/unit/content/section-schemas.test.ts`, `specs/002-site-foundation/research.md`,
`docs/testing.md` and the chore folder. The three targeted unit files pass (63 tests). No
CRITICAL or HIGH findings.

Principle III verdict **major** stands: `/public/_headers` is listed in `.github/CODEOWNERS`
under "Paths that are major changes by definition". Auto-merge off; Don checks the preview.

## Checks

- **Six rules in order (acceptance 1):** pass. `/_astro/*.svg` sits between `/_astro/*` and
  `/writing/*/question-source.json` with a single header; the other rules are byte-identical.
- **SVG policy fits the diagrams:** pass. The six diagrams in
  `src/content/projects/images/*/*.svg` each have one inline `<style>`,
  `url(data:font/woff2…)` faces and `url(#arrow)` markers; none has `<script>`, `<image>`,
  `<foreignObject>`, an external href or `@import`.
- **Matching under `_headers` semantics:** pass. The miniflare asset worker
  (`assets.worker.js:468`) compiles each rule with `split("*")…join("(?<splat>.*)")`,
  anchored; `attachCustomHeaders` (`:528`–`:546`) sets the header on the first match and
  appends on later ones, so the two CSP values are comma-joined. In `dist/_astro` (108 files)
  the rule matches all 25 `.svg` files and nothing else.
- **Minimal policy (acceptance 3):** pass. The test requires `default-src 'none'` and a bare
  `sandbox`, and forbids `script-src`, `unsafe-eval`, `allow-`, `https:` and `'self'`.
- **Regex (acceptance 6):** pass, checked in node. New: accepts `/`, `/x`, `/services/`,
  `https://example.com/`; rejects `//host`, `/\host`, `http://x`, `services`, `javascript:`,
  `HTTPS://`. The old regex accepted `//host` and `/\host`.
- **Section schemas reuse `linkTarget`:** pass.
- **No weakened checks:** pass. The `/*` assertions, the `/_astro/*` Cache-Control assertions
  and the `starRule()` CSP check are unchanged apart from one comment clause; the rule-count
  test is stricter.
- **Test layer:** pass. All new cases are unit tests, as planned; no E2E added.
- **No `specs/` literals in new tests:** pass (the `specs/022 T023` comment at
  `headers.test.ts:59` predates this chore).
- **docs/testing.md:** pass, one clause in the fonts paragraph.
- **Research (acceptance 7):** passes in substance; see LOW-1.

## Findings

**CRITICAL:** none. **HIGH:** none.

**LOW**

- **LOW-1** `specs/002-site-foundation/research.md:220`: acceptance 7 says a grep for
  `upgrade-insecure-requests` finds nothing, while W5 asks for an explanatory sentence naming
  it, so the plan contradicts itself. The implementation followed W5 (the directive is gone
  from the list), which is the right outcome. Cosmetic: the sentence sits in the CSP bullet
  and the line is 132 characters.
- **LOW-2** `src/content/schemas/shared.ts:65`: the URL parser strips tab, LF and CR anywhere,
  so `"/\t/example.com"` passes the regex but a browser reads it as `//example.com`.
  Negligible (Don is the only author). Follow-up: lookahead `(?![/\\\t\n\r])` or reject any
  whitespace.
- **LOW-3** `plan.md:81`: the plan says the icons in `src/icons/` are never served, but the
  build emits `moon.*.svg`, `menu.*.svg`, `linkedin.*.svg` and others to `/_astro/`. The rule
  now covers them too; they use only presentation attributes, so nothing breaks.
- **LOW-4** W3 and W4 each landed test and fix in one commit, so the red run is not visible in
  history. Red confirmed by evaluation: the old regex accepts both `//` and `/\`.
- **LOW-5** Acceptance 4 (served `curl -sI`) and 5 (Chromium direct open) are not recorded on
  the branch; they are covered by the W2 `[PREVIEW-CHECK]`. This review checked the matching
  statically against the asset worker and `dist/`.

## Before / after

| Measure | Before | After |
| --- | --- | --- |
| `_headers` rules | 5 | 6 |
| `it(` cases in the three files | 38 (10 + 14 + 14) | 42 (12 + 16 + 14) |
| New or changed cases against the old code | — | 6 red (six-rules order, SVG exact value, SVG minimal, page-schema protocol-relative reject, Offering and CallToAction rejects) |
| Targeted files | — | all green, 3 files, 63 tests |
| `linkTarget` accepts `//` and `/\` | yes | no |
| Copies of the link regex | 2 | 1 |

## Follow-ups for the PR body

- Major change under Principle III, auto-merge off. Don does the W2 `[PREVIEW-CHECK]`: the
  diagram on a project page looks unchanged; the diagram's `/_astro/….svg` opened directly
  renders Inter text; DevTools shows both CSP policies, comma-joined.
- A diagram that later needs more than inline styles and `data:` fonts (for example an
  embedded raster `<image>`, which needs `img-src data:`) will be blocked when opened directly.
- Other non-HTML files under `/_astro/` keep the thin policy; none exist today besides SVG.
  Revisit if Astro starts emitting HTML-capable files there.
- LOW-2: `linkTarget` could also reject tab, LF and CR after the leading `/`.
- LOW-3: icon SVGs get the sandboxed policy too, with no visible effect.
