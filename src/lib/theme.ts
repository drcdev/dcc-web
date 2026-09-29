// Pure theme helpers (contracts/theme.md; data-model.md ThemeChoice).
// Used by the theme switch; the pre-paint script src/scripts/theme-init.js
// repeats the same rules in plain JavaScript because it must run inline
// before first paint.

export type ThemeChoice = "dark" | "light" | "system";

/** localStorage key, the same one Flux used. */
export const THEME_STORAGE_KEY = "color-theme";

const CYCLE: readonly ThemeChoice[] = ["dark", "light", "system"];

/** A stored value as a choice; absent or unrecognised values mean dark (FR-015). */
export function parseTheme(value: string | null | undefined): ThemeChoice {
  return value === "light" || value === "system" || value === "dark" ? value : "dark";
}

/** dark → light → system → dark (FR-012). */
export function nextTheme(choice: ThemeChoice): ThemeChoice {
  return CYCLE[(CYCLE.indexOf(choice) + 1) % CYCLE.length]!;
}

/** Whether the page should use the dark theme for this choice. */
export function isDark(choice: ThemeChoice, prefersDark: boolean): boolean {
  return choice === "system" ? prefersDark : choice === "dark";
}
