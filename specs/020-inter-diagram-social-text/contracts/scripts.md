# Contract: the two hand-run scripts

Neither script runs in the build, in CI or in any test. Tests import their exported pure
functions and constants only (each script's side effects run under `if (import.meta.main)`).

## `scripts/fonts/embed-diagram-fonts.ts` (new)

```text
node scripts/fonts/embed-diagram-fonts.ts [<file.svg> ...]
pnpm run fonts:diagrams [-- <file.svg> ...]
```

| Row | Behaviour |
|---|---|
| S01 | With no arguments, processes every `.svg` under `src/content/` that contains `<text` (the same set the gate checks). With arguments, processes only those files; a path outside `src/content/` or without `<text` is an error. |
| S02 | Collects the label characters (decoded entities) plus U+0020 and writes them to a temporary text file. |
| S03 | For each face, runs `uvx --from "fonttools[woff]==4.60.2" pyftsubset src/assets/fonts/Inter-<Regular\|Bold>.woff2 --text-file=<tmp> --layout-features=kern --no-hinting --name-IDs=0,1,2,3,4,5,6 --flavor=woff2 --output-file=<tmp>.woff2`. The argument list comes from an exported `diagramSubsetArgs(face, input, textFile, output)`; the fonttools pin is `FONTTOOLS_SPEC` imported from `scripts/fonts/subset-inter.ts`, so both scripts use one version. |
| S04 | Replaces the existing font block (licence comment plus `<style data-inter-subset>…</style>`) or, when absent, inserts it directly after the root `<svg …>` start tag. Every other byte of the file is unchanged (exported pure `withFontBlock(svg, regularB64, boldB64)`). |
| S05 | Before writing, runs the same checks as the gate (D01 to D08, from `scripts/fonts/diagram-fonts.ts`) on the result; on any problem it prints the messages, writes nothing for that file and exits non-zero. |
| S06 | Prints, per file, the path and the bytes before and after. |
| S07 | Re-running on an unchanged file gives a byte-identical file (fonttools output is deterministic, as 018 recorded). |
| S08 | `uvx` missing: fails with `uvx not found. Install uv: brew install uv` (same text as `subset-inter.ts`). |

## `scripts/fonts/diagram-fonts.ts` (new, pure module)

Exports, with no side effects and no imports beyond `node:` built-ins and `src/lib/fonts/charset.ts`:

- `labelText(svg: string): string[]` — decoded character data of each `<text>`/`<tspan>`.
- `fontBlock(regularB64: string, boldB64: string): string` — the comment plus `<style>` block.
- `withFontBlock(svg, regularB64, boldB64): string` — S04.
- `embeddedFaces(svg): { weight: string; base64: string }[]` — parsed `@font-face` rules.
- `diagramProblems(svg: string, file: string, readFace: (buf: Buffer) => { weight: string; unicodeRangeArray: string[] }): string[]` — every D01 to D08 message for one file; empty when it passes. The face reader is injected so the module needs no `fontace` import; callers pass fontace through Astro's dependency.
- `DIAGRAM_FONT_FAMILY = "Inter, sans-serif"`, `DIAGRAM_MAX_BYTES = 16 * 1024`.

## `scripts/og-image/render.ts` (changed)

```text
node scripts/og-image/render.ts
```

| Row | Behaviour |
|---|---|
| O01 | Exports `OG_FONT_FILE`, the absolute path of `src/assets/fonts/Inter-Bold.woff2`. |
| O02 | Exports `ogHtml(fontBase64: string): string`: today's template with one `@font-face` (`font-family: Inter`, `font-weight: 700`, `font-style: normal`, `src: url(data:font/woff2;base64,<fontBase64>) format("woff2")`) and `font-family: Inter` on `body`. No other `font-family` value, no family from `SYSTEM_FONT_STACK`, no generic family. |
| O03 | Size 1200×630, colours `#1c1a29` and `#d68844`, 112 px bold heading with letter-spacing -0.02em, 160×8 rule with 40 px top margin and 4 px radius, 96 px side padding: unchanged. |
| O04 | Under `import.meta.main` only: reads `OG_FONT_FILE`, dynamically imports `@playwright/test`, sets the content, awaits `document.fonts.ready`, throws `Inter Bold did not load; the sharing image was not written` unless a `FontFace` in `document.fonts` with family `Inter` and weight `700` has status `loaded` **and** `document.fonts.check("700 112px Inter", "Don Coleman")` is true (`check()` alone can return true when no face matches), then writes `public/og-default.png`. |
