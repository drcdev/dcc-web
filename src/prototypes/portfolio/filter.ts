// Theme filter rule (data-model.md "Filter rule"). Shared by the build-time
// markup and the <portfolio-filter> island.
import type { Theme } from "./types.ts";

/** Sorted, unique themes across the entries. */
export function themesOf(entries: ReadonlyArray<{ themes: readonly Theme[] }>): Theme[] {
  return [...new Set(entries.flatMap((e) => e.themes))].sort((a, b) => a.localeCompare(b));
}

/** True when no theme is selected or the entry lists that theme exactly. */
export function matches(entry: { themes: readonly Theme[] }, theme: Theme | null): boolean {
  return theme === null || entry.themes.includes(theme);
}

/** Reads `?theme=`. An unknown value sets `unknown` so the island can show the no-match message. */
export function parseThemeParam(search: string, known: readonly Theme[]): { theme: Theme | null; unknown: boolean } {
  const value = new URLSearchParams(search).get("theme");
  if (value === null) return { theme: null, unknown: false };
  if (known.includes(value)) return { theme: value, unknown: false };
  return { theme: null, unknown: true };
}
