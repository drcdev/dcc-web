# Contract: `<project-filter>` island

Defined in `src/components/project/ProjectFilter.astro` (processed `<script>`, custom element,
deferred module). Pure logic in `src/lib/content/themes.ts` (`themeKey`, `themesOf`,
`parseThemeParam`, `matches`), unit-tested and used at build time too.

## Inputs (from the server-rendered HTML)

- Rows: `[data-project]` with `data-themes="key1|key2"` (normalised keys).
- Buttons: `[data-filter-all]` and one `button[data-theme=<key>]` per theme, label = theme label.
- `[data-filter-status]` (`role="status"`), `[data-filter-empty]`, `[data-filter-clear]`.

## Behaviour

| Event | Result |
|---|---|
| Load, no `?theme=` | All rows shown; "All projects" pressed; status "Showing all N projects." |
| Load, `?theme=<value>` matching a key after `themeKey()` | Only rows with that key shown; that button `aria-pressed="true"`; status "Showing K projects about <label>." (K=1 → "project"); address unchanged |
| Load, unknown `?theme=` | No rows shown; empty message and "Show all projects" button; status "No projects match this theme."; address kept until cleared |
| Click a theme button | Filter as above; `history.replaceState` sets `?theme=<key>` (no new history entry, so Back leaves the index) |
| Click "All projects" or "Show all projects" | All rows; `?theme` removed |
| Back from a story | The index loads with its `?theme=` and reapplies it (bfcache or reload) |

Status text updates are announced once per change (polite). Focus stays on the pressed button;
"Show all projects" (which then hides) moves focus to "All projects". The group is named "Filter
by theme". The `?theme=` value is never written into the page as markup.
Buttons wrap onto more lines (no overflow). Targets ≥ 24×24 px (WCAG 2.2 2.5.8).

## Without JavaScript

Controls, status line and empty message stay `hidden` until the island has finished setting up
(`data-ready` on `<project-filter>`), so the same holds when the script is blocked or fails; every project is
listed; no control is shown that does nothing (FR-062, US5 AS4).
