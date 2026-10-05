// Themes are free text in project files. They are compared by key, so spelling
// variants such as "AI integration" and "ai  integration" are one theme
// (data-model.md "Theme (derived)"). Shared by the build-time markup and the
// filter island.

export interface Theme {
  key: string;
  label: string;
}

/** Trim, collapse spaces, lower-case, and join words with hyphens. */
export function themeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase().replace(/ /g, "-");
}

/** Unique themes across the entries (first spelling is the label), sorted by label. */
export function themesOf(entries: ReadonlyArray<{ themes: readonly string[] }>): Theme[] {
  const byKey = new Map<string, Theme>();
  for (const raw of entries.flatMap((entry) => entry.themes)) {
    const key = themeKey(raw);
    if (!byKey.has(key)) byKey.set(key, { key, label: raw.trim().replace(/\s+/g, " ") });
  }
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** True when the index lists more projects than the threshold, so the filter is worth showing. */
export function showsThemeFilter(count: number, threshold: number): boolean {
  return count > threshold;
}

/** Reads `?theme=`. An unknown value sets `unknown` so the page can show the no-match message. */
export function parseThemeParam(
  search: string,
  known: readonly Theme[],
): { key: string | null; unknown: boolean } {
  const value = new URLSearchParams(search).get("theme");
  if (value === null) return { key: null, unknown: false };
  const key = themeKey(value);
  if (known.some((theme) => theme.key === key)) return { key, unknown: false };
  return { key: null, unknown: true };
}

const projects = (count: number) => `${count} ${count === 1 ? "project" : "projects"}`;

/**
 * The polite status line for the current filter (contracts/filter-island.md).
 * An unknown theme never repeats the address value.
 */
export function filterStatus(state: { shown: number; total: number; theme: Theme | null; unknown: boolean }): string {
  if (state.unknown) return "No projects match this theme.";
  if (state.theme) return `Showing ${projects(state.shown)} about ${state.theme.label}.`;
  return `Showing all ${projects(state.total)}.`;
}

/** The query string with `theme` set to the key, or removed when the key is null. */
export function themeSearch(search: string, key: string | null): string {
  const params = new URLSearchParams(search);
  if (key === null) params.delete("theme");
  else params.set("theme", key);
  const text = params.toString();
  return text === "" ? "" : `?${text}`;
}

/** True when no theme is selected or the entry lists that theme (by key). */
export function matches(entry: { themes: readonly string[] }, key: string | null): boolean {
  return key === null || entry.themes.some((raw) => themeKey(raw) === key);
}
