// Unit tests for the pure theme helpers in src/lib/theme.ts
// (contracts/theme.md; data-model.md ThemeChoice; FR-011, FR-012, FR-015).
import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, isDark, nextTheme, parseTheme, themeLabel } from "../../../src/lib/theme.ts";

describe("THEME_STORAGE_KEY", () => {
  it("is Flux's key, color-theme", () => {
    expect(THEME_STORAGE_KEY).toBe("color-theme");
  });
});

describe("parseTheme", () => {
  it.each(["dark", "light", "system"] as const)("accepts %s", (value) => {
    expect(parseTheme(value)).toBe(value);
  });

  it.each([null, undefined, "", "Dark", "LIGHT", "auto", "garbage", " dark", "dark "])(
    "treats %j as dark",
    (value) => {
      expect(parseTheme(value)).toBe("dark");
    },
  );
});

describe("nextTheme", () => {
  it("cycles dark → light → system → dark", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("system");
    expect(nextTheme("system")).toBe("dark");
  });
});

describe("isDark", () => {
  it("is always true for dark", () => {
    expect(isDark("dark", false)).toBe(true);
    expect(isDark("dark", true)).toBe(true);
  });

  it("is always false for light", () => {
    expect(isDark("light", false)).toBe(false);
    expect(isDark("light", true)).toBe(false);
  });

  it("follows the device for system", () => {
    expect(isDark("system", true)).toBe(true);
    expect(isDark("system", false)).toBe(false);
  });
});

describe("themeLabel", () => {
  it('names the choices "Dark", "Light" and "Match device" (FR-012a)', () => {
    expect(themeLabel("dark")).toBe("Dark");
    expect(themeLabel("light")).toBe("Light");
    expect(themeLabel("system")).toBe("Match device");
  });
});
