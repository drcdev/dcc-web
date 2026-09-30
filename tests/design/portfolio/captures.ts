// The 24 screenshot combinations for docs/design/portfolio/ (contracts/decision-document.md).
export const DIRECTIONS = ["a", "b", "c"] as const;
export const PAGES = ["index", "story"] as const;
export const SIZES = [
  { label: "phone", width: 390, height: 844 },
  { label: "desktop", width: 1280, height: 800 },
] as const;
export const THEMES = ["light", "dark"] as const;

export interface Capture {
  name: string;
  path: string;
  width: number;
  height: number;
  theme: (typeof THEMES)[number];
}

export const CAPTURES: Capture[] = DIRECTIONS.flatMap((d) =>
  PAGES.flatMap((p) =>
    SIZES.flatMap((s) =>
      THEMES.map((theme) => ({
        name: `${d}-${p}-${s.label}-${theme}.webp`,
        path: p === "index" ? `/design/portfolio/${d}/` : `/design/portfolio/${d}/focus-pocus/`,
        width: s.width,
        height: s.height,
        theme,
      })),
    ),
  ),
);
