import type { Page } from "@playwright/test";

// The footer prints the year the site was built, so a new calendar year would change the footer,
// not-found and sections snapshots with no design change (issue #45). The visual project sets the
// year to this fixed one before every shot. It is 2026 because that is the year in the committed
// baselines; changing it means refreshing every year-bearing baseline.
export const FROZEN_FOOTER_YEAR = 2026;

// "© 2026": the copyright sign, optional space, four digits. Kept as a source string so it can be
// passed into the page, which cannot see this module's closure.
export const YEAR_PATTERN_SOURCE = "(©\\s*)\\d{4}";

// Pure text rewrite: the copyright year replaced, everything else untouched. Returns null when
// the text has no copyright year, so the caller can fail loudly rather than skip silently.
export function freezeYearText(text: string, year: number = FROZEN_FOOTER_YEAR): string | null {
  const pattern = new RegExp(YEAR_PATTERN_SOURCE);
  if (!pattern.test(text)) return null;
  return text.replace(pattern, `$1${year}`);
}

// Rewrites the year in the footer's copyright paragraph and throws unless exactly one paragraph
// matched. If the footer's copyright line is ever reworded, this fails in every visual test: that
// is intended, and the fix is a one-line change to YEAR_PATTERN_SOURCE.
export async function freezeFooterYear(page: Page): Promise<void> {
  const count = await page.evaluate(
    ({ source, year }) => {
      const pattern = new RegExp(source);
      let changed = 0;
      for (const p of Array.from(document.querySelectorAll("footer p"))) {
        const text = p.textContent ?? "";
        if (!pattern.test(text)) continue;
        p.textContent = text.replace(pattern, `$1${year}`);
        changed += 1;
      }
      return changed;
    },
    { source: YEAR_PATTERN_SOURCE, year: FROZEN_FOOTER_YEAR },
  );
  if (count !== 1) {
    throw new Error(`freezeFooterYear: expected exactly one footer paragraph with a copyright year, found ${count}`);
  }
}
