// Layout geometry smoke test: every page template at phone and desktop width, with JavaScript
// on, reads no content and needs no baselines (issue #40, V4). It is the content-independent
// replacement for what the removed real-content snapshots caught by eye: a page that spills
// sideways, an element wider than the screen, or a header or footer that runs into the main
// content.
//
// Overlap with other specs: no-js.spec.ts asserts no horizontal page scroll per template with
// JavaScript off, and a11y.spec.ts asserts it at 320 px for reflow. This spec asserts it with
// JavaScript on (menu button, theme switch and islands present), next to the two checks nothing
// else makes. The extra assertions cost no extra page load.
//
// Skip rule for the "no element wider than the viewport" walk. An element is exempt when:
//   - its box has zero width or height (display: none, the closed mobile menu list, empty
//     wrappers);
//   - its computed visibility is hidden or collapse;
//   - it or an ancestor is visually hidden (computed clip is rect(0px, 0px, 0px, 0px) or
//     clip-path is inset(50%)): Tailwind sr-only and the unfocused skip link;
//   - any ancestor below body has a computed overflow-x other than visible: its painted extent
//     is clipped by, or scrolls inside, that ancestor (code blocks, tables in scroll wrappers,
//     overflow-hidden cards). The scroll container itself is still checked.
// An element is an offender when its box starts left of the viewport or ends right of it, with
// 1 px of tolerance for sub-pixel rounding. There is no per-template exemption.
import { test, expect } from "@playwright/test";
import { NOT_FOUND_PENDING, TEMPLATES } from "./templates.ts";

const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

for (const template of TEMPLATES) {
  for (const size of WIDTHS) {
    test(`${template.name} at ${size.name} width keeps its layout inside the viewport`, async ({ page }) => {
      test.fixme(!template.built, NOT_FOUND_PENDING);
      await page.setViewportSize({ width: size.width, height: size.height });
      // Reduced motion puts story chapters in their final state, so no transform sits off-screen
      // mid-animation. Motion itself is covered by projects-motion.spec.ts.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(template.path);
      await page.evaluate(() => document.fonts.ready);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, "page scrolls horizontally").toBeLessThanOrEqual(clientWidth);

      const offenders = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const tolerance = 1;
        const hiddenByClip = (style: CSSStyleDeclaration) =>
          style.clip === "rect(0px, 0px, 0px, 0px)" || style.clipPath === "inset(50%)";
        const describe = (el: Element, r: DOMRect) => {
          const id = el.id ? `#${el.id}` : "";
          const classes = [...el.classList].map((c) => `.${c}`).join("");
          return `${el.tagName.toLowerCase()}${id}${classes} (left ${Math.round(r.left)}, right ${Math.round(r.right)})`;
        };
        const found: string[] = [];
        for (const el of document.body.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.visibility === "collapse") continue;
          if (hiddenByClip(style)) continue;
          let skip = false;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const ps = getComputedStyle(p);
            if (hiddenByClip(ps) || ps.overflowX !== "visible") {
              skip = true;
              break;
            }
          }
          if (skip) continue;
          if (r.left < -tolerance || r.right > vw + tolerance) found.push(describe(el, r));
        }
        return found;
      });
      expect(offenders, "elements outside the viewport width").toEqual([]);

      const header = await page.locator("body > header").boundingBox();
      const main = await page.locator("#main").boundingBox();
      const footer = await page.locator("body > footer").boundingBox();
      expect(header, "header has a box").not.toBeNull();
      expect(main, "main has a box").not.toBeNull();
      expect(footer, "footer has a box").not.toBeNull();
      expect(header!.y + header!.height, "header overlaps main").toBeLessThanOrEqual(main!.y + 1);
      expect(footer!.y, "footer has to sit below main").toBeGreaterThanOrEqual(main!.y + main!.height - 1);
    });
  }
}
