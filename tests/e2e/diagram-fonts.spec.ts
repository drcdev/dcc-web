// Inter in diagram SVGs, in a real browser (specs/020-inter-diagram-social-text; contracts/
// diagram-svg.md D11 and D12). Only a browser shows whether the embedded data-URI face actually
// loads and how wide the shaped text really is, which is why this is the E2E layer; the static
// file rules (D01 to D08) are in tests/unit/site/diagram-fonts.test.ts. Each diagram is opened
// directly from disk, the way an image document is rendered, so the page's own fonts cannot help.
// Diagram files are found by globbing src/content/, never by name.
import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test, expect } from "@playwright/test";
import { filesUnder } from "../helpers/files.ts";

const root = resolve(import.meta.dirname, "../..");

const diagrams = filesUnder(join(root, "src/content"))
  .filter((path) => path.endsWith(".svg") && readFileSync(path, "utf-8").includes("<text"))
  .map((path) => ({ file: relative(root, path), url: pathToFileURL(path).href }));

/** Horizontal room required between a label and the side of its box, in SVG user units. */
const SIDE_MARGIN = 16;

type Label = {
  text: string;
  size: number;
  weight: string;
  box: { x: number; y: number; width: number; height: number };
  rect: { x: number; y: number; width: number; height: number } | null;
};

test("finds at least the published diagrams and the template starter", () => {
  expect(diagrams.length).toBeGreaterThanOrEqual(2);
  expect(diagrams.some((d) => d.file.includes("/template/"))).toBe(true);
});

for (const { file, url } of diagrams) {
  test.describe(file, () => {
    test(`D11: ${file} loads an Inter face for every weight its labels use`, async ({ page }) => {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const result = await page.evaluate(() => {
        const labels = [...document.querySelectorAll("text")].map((el) => {
          const style = getComputedStyle(el);
          return {
            text: (el.textContent ?? "").trim(),
            size: parseFloat(style.fontSize),
            weight: style.fontWeight,
          };
        });
        const faces = [...document.fonts].map((f) => ({ family: f.family.replace(/["']/g, ""), weight: String(f.weight), status: f.status }));
        const checks = labels.map((l) => ({ ...l, ok: document.fonts.check(`${l.weight} ${l.size}px Inter`, l.text) }));
        return { faces, checks };
      });
      const loaded = result.faces.filter((f) => f.family === "Inter" && f.status === "loaded").map((f) => f.weight);
      const weights = new Set(result.checks.map((c) => c.weight));
      expect(weights.size, `${file}: at least one label`).toBeGreaterThan(0);
      for (const weight of weights) {
        expect(loaded, `${file}: an Inter face of weight ${weight} is loaded`).toContain(weight);
      }
      for (const c of result.checks) {
        expect(c.ok, `${file}: "${c.text}" at ${c.weight} ${c.size}px is drawable in Inter`).toBe(true);
      }
    });

    test(`D12: ${file} labels sit inside their box with room at the sides and never overlap`, async ({ page }) => {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const labels = await page.evaluate((): Label[] => {
        const rects = [...document.querySelectorAll("rect")].map((r) => r.getBBox());
        return [...document.querySelectorAll("text")].map((el) => {
          const b = el.getBBox();
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          const containing = rects
            .filter((r) => cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height)
            .sort((a, c) => a.width * a.height - c.width * c.height)[0];
          const style = getComputedStyle(el);
          return {
            text: (el.textContent ?? "").trim(),
            size: parseFloat(style.fontSize),
            weight: style.fontWeight,
            box: { x: b.x, y: b.y, width: b.width, height: b.height },
            rect: containing ? { x: containing.x, y: containing.y, width: containing.width, height: containing.height } : null,
          };
        });
      });
      expect(labels.length, `${file}: has labels`).toBeGreaterThan(0);

      for (const l of labels) {
        if (!l.rect) continue; // a label outside any box has nothing to fit inside
        const left = l.box.x - l.rect.x;
        const right = l.rect.x + l.rect.width - (l.box.x + l.box.width);
        expect(left, `${file}: "${l.text}" has ${SIDE_MARGIN} units on the left (has ${left.toFixed(2)})`).toBeGreaterThanOrEqual(SIDE_MARGIN);
        expect(right, `${file}: "${l.text}" has ${SIDE_MARGIN} units on the right (has ${right.toFixed(2)})`).toBeGreaterThanOrEqual(SIDE_MARGIN);
        expect(l.box.y, `${file}: "${l.text}" stays inside the top of its box`).toBeGreaterThanOrEqual(l.rect.y);
        expect(l.box.y + l.box.height, `${file}: "${l.text}" stays inside the bottom of its box`).toBeLessThanOrEqual(l.rect.y + l.rect.height);
      }

      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i]!.box;
          const b = labels[j]!.box;
          const overlaps = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
          expect(overlaps, `${file}: "${labels[i]!.text}" overlaps "${labels[j]!.text}"`).toBe(false);
        }
      }
    });
  });
}
