// Theme tokens (issue #40, V5): the key components of the site resolve to the design-system
// token each theme gives them, and the `dark` class on <html> alone flips every one that has a
// dark value. Every probe runs on the fixture site (port 4322) at the desktop width, because a
// colour does not depend on the width.
//
// Why this is an E2E test: which token an element gets in a theme comes out of the cascade
// (Tailwind's `dark:` variant, `.dark .prose-accent` against `dark:prose-invert`, component CSS),
// and only a browser's computed style shows that. Why it is also here when other layers cover
// colour: axe (the `a11y` project) checks contrast ratios, and a wrong token can still pass
// contrast; the visual snapshots fail on any pixel change but do not say which token moved. A
// failure here names the component, the property, the theme and the token. The heading colours
// of the sections page are already checked in sections.spec.ts and are not repeated.
//
// How a value is checked: the expected colour is the computed colour of a probe element given
// `var(--color-<token>)`, so the test follows the stylesheet and holds no colour literal. A token
// that does not exist fails by name instead of passing as the fallback. The actual colour is read
// with `expect(locator).toHaveCSS()`, which retries until a colour transition has settled
// (reduced motion is on as well, so none runs). The page then loses or gains the `dark` class in
// place, with no reload, and every probe is checked again against the other theme's token.
//
// Focus rings: in dark mode the prose link and its ring share `accent-400`, and a ring that
// falls back to `currentColor` (no `outline-color` rule) would read the same colour. So the
// focus probes also prove that the ring is the site's rule and not `currentColor`: no outline
// before focus, the site's ring shape after it, and a ring colour that ignores the text colour.
//
// A note on the probe tables:
// - The site has no callout component (post row P19 uses `Callout` only as an example of an
//   unknown section tag), so the prose blockquote, the one set-apart block of text a post
//   renders, stands in for "callouts".
import { test, expect, type Locator, type Page } from "@playwright/test";
import { FIXTURE_SITE } from "./templates";
import { expectThemeClass, setTheme, type Theme } from "./color-theme.ts";
import { findTopic, pillRowTopics, seriesIds } from "../../src/config/topics.ts";

/** A token name (`dusk-200` is `--color-dusk-200`) or the literal `transparent`. */
type Token = string;

interface Probe {
  /** Names the component in a failure message. */
  name: string;
  selector: string;
  /** The selector matches several elements and the first one is the subject. */
  first?: boolean;
  /** Keep only matches holding this text. */
  hasText?: string;
  /** Focus the element before reading it, to read its focus ring. */
  focus?: boolean;
  /** Each computed property with its [light, dark] token. */
  props: Record<string, [light: Token, dark: Token]>;
}

interface Page_ {
  path: string;
  /** Wait until the page has run its scripts and loaded what it shows. */
  ready: (page: Page) => Promise<void>;
  probes: Probe[];
}

const PAGES: Page_[] = [
  {
    path: "/sections/",
    ready: async (page) => {
      await expect(page.locator("[data-theme-switch]")).toBeVisible();
    },
    probes: [
      { name: "page background", selector: "body", props: { "background-color": ["white", "dusk-BASE"] } },
      {
        name: "header rule",
        selector: 'body > header nav[aria-label="Main"]',
        props: { "border-bottom-color": ["dusk-200", "dusk-600"] },
      },
      {
        name: "header background",
        selector: 'body > header nav[aria-label="Main"]',
        props: { "background-color": ["transparent", "dusk-900"] },
      },
      {
        name: "site name",
        selector: 'body > header nav a[href="/"]',
        first: true,
        props: { color: ["dusk-900", "white"] },
      },
      { name: "theme switch", selector: "[data-theme-switch]", props: { color: ["dusk-500", "dusk-400"] } },
      { name: "footer background", selector: "body > footer", props: { "background-color": ["transparent", "dusk-900"] } },
      { name: "footer rule", selector: "body > footer hr", props: { "border-top-color": ["dusk-200", "dusk-700"] } },
      {
        name: "footer copyright",
        selector: "body > footer p",
        hasText: "Don Coleman",
        first: true,
        props: { color: ["mauve-600", "mauve-400"] },
      },
      {
        name: "CTA button",
        selector: "main a",
        hasText: "Get in touch",
        first: true,
        props: { "background-color": ["rust-600", "rust-300"], color: ["white", "dusk-900"] },
      },
      {
        name: "CTA button focus ring",
        selector: "main a",
        hasText: "Get in touch",
        first: true,
        focus: true,
        props: { "outline-color": ["accent-500", "accent-400"] },
      },
    ],
  },
  {
    path: "/",
    ready: async (page) => {
      await expect(page.locator("[data-theme-switch]")).toBeVisible();
    },
    probes: [
      {
        name: "home intro CTA button",
        selector: 'main section a[href="/work-with-me/"]',
        first: true,
        props: { "background-color": ["rust-600", "rust-300"], color: ["white", "dusk-900"] },
      },
    ],
  },
  {
    path: "/writing/every-part/",
    ready: async (page) => {
      await expect(page.locator(".code-card__button")).toBeVisible();
    },
    probes: [
      {
        name: "title card",
        selector: "[data-title-card]",
        props: { "background-color": ["white", "dusk-800"], "border-top-color": ["dusk-200", "dusk-700"] },
      },
      {
        name: "topic pill",
        selector: '[data-title-card] a[data-topic-pill][href="/writing/topics/compliant-data/"]',
        props: { "background-color": ["rust-100", "rust-900"], color: ["rust-900", "rust-100"] },
      },
      {
        name: "free-form pill",
        selector: "[data-title-card] a[data-free-form]",
        // The border is the dark-mode edge that keeps this pill visible on a dusk-800 card
        // (issue #46). Only a browser shows that Tailwind's `dark:` variant applies the token;
        // the unit test reads class strings only.
        props: {
          "background-color": ["dusk-100", "dusk-800"],
          color: ["dusk-900", "dusk-100"],
          "border-top-color": ["transparent", "dusk-400"],
        },
      },
      {
        name: "series marker",
        selector: "[data-title-card] [data-series-marker]",
        props: { "border-top-color": ["lavender-700", "lavender-300"], "background-color": ["lavender-100", "lavender-900"] },
      },
      {
        name: "featured mark",
        selector: "[data-title-card] [data-featured-mark]",
        props: { "background-color": ["accent-100", "accent-900"], color: ["accent-900", "accent-100"] },
      },
      {
        name: "code card",
        selector: "[data-code-block]",
        props: { "background-color": ["dusk-50", "dusk-900"], "border-top-color": ["dusk-200", "dusk-700"] },
      },
      {
        name: "copy button",
        selector: ".code-card__button",
        props: {
          "background-color": ["white", "dusk-800"],
          color: ["dusk-800", "mist-100"],
          "border-top-color": ["dusk-300", "dusk-600"],
        },
      },
      { name: "code text", selector: ".astro-code", props: { color: ["dusk-800", "mist-200"] } },
      { name: "table cell", selector: ".table-wrapper td", first: true, props: { color: ["dusk-700", "mist-200"] } },
      {
        name: "table header rule",
        selector: ".table-wrapper th",
        first: true,
        props: { "border-bottom-color": ["dusk-200", "dusk-700"] },
      },
      {
        name: "quote (stands in for callouts)",
        selector: "[data-post-body] blockquote",
        props: { color: ["dusk-900", "mist-100"], "border-left-color": ["accent-300", "accent-700"] },
      },
      {
        name: "prose link",
        selector: '[data-post-body] a[href="/writing/all/"]',
        props: { color: ["accent-600", "accent-400"] },
      },
      {
        name: "prose link focus ring",
        selector: '[data-post-body] a[href="/writing/all/"]',
        focus: true,
        props: { "outline-color": ["accent-500", "accent-400"] },
      },
      {
        name: "share control",
        selector: "[data-share] a",
        first: true,
        props: { color: ["rust-800", "rust-300"], "border-top-color": ["rust-600", "rust-300"] },
      },
    ],
  },
  {
    path: "/projects/retired/",
    ready: async (page) => {
      await expect(page.locator("[data-story-title]")).toBeVisible();
    },
    probes: [
      {
        name: "status pill (retired)",
        selector: '[data-status="retired"]',
        props: {
          "background-color": ["mauve-50", "mauve-800"],
          color: ["mauve-950", "mauve-100"],
          "border-top-color": ["mauve-800", "mauve-300"],
        },
      },
    ],
  },
  {
    path: "/projects/every-part/",
    ready: async (page) => {
      await expect(page.locator("[data-story-title]")).toBeVisible();
    },
    probes: [
      { name: "story title", selector: "[data-story-title]", props: { color: ["dusk-900", "white"] } },
      {
        name: "status pill (in progress)",
        selector: '[data-status="in-progress"]',
        props: {
          "background-color": ["rust-50", "dusk-900"],
          color: ["rust-950", "rust-100"],
          "border-top-color": ["rust-800", "rust-300"],
        },
      },
      { name: "build link", selector: "[data-build-links] a", first: true, props: { color: ["dusk-900", "white"] } },
      {
        name: "build link focus ring",
        selector: "[data-build-links] a",
        first: true,
        focus: true,
        props: { "outline-color": ["accent-500", "accent-400"] },
      },
      {
        name: "invitation link",
        selector: "[data-invitation]",
        props: { color: ["dusk-900", "white"], "border-top-color": ["accent-700", "accent-300"] },
      },
    ],
  },
];

/**
 * The computed colour of a design-system token, read from a throwaway element. Setting the
 * property through the CSSOM is allowed by the site's CSP (setAttribute("style") is not). The
 * fallback makes a missing token visible: Tailwind emits only the theme variables it uses.
 */
async function colourOf(page: Page, token: Token): Promise<string> {
  if (token === "transparent") return "rgba(0, 0, 0, 0)";
  const got = await page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.setProperty("color", `var(--color-${name}, rgb(1, 2, 3))`);
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, token);
  expect(got, `token --color-${token} is not defined`).not.toBe("rgb(1, 2, 3)");
  return got;
}

function subject(page: Page, probe: Probe): Locator {
  const found = page.locator(probe.selector).filter({ hasText: probe.hasText });
  return probe.first ? found.first() : found;
}

/**
 * Proves a focused element shows the site's own ring. The shape is the site's rule
 * (`outline-2 outline-offset-2`), not Chromium's default (`auto`, 1px, offset 0). The colour is
 * read again after the text colour is overridden in place, because a ring that falls back to
 * `currentColor` follows it and a token ring does not.
 */
async function expectRealRing(locator: Locator, ringColour: string, label: string) {
  await expect(locator, `${label} outline-style`).toHaveCSS("outline-style", "solid");
  await expect(locator, `${label} outline-width`).toHaveCSS("outline-width", "2px");
  await expect(locator, `${label} outline-offset`).toHaveCSS("outline-offset", "2px");
  await locator.evaluate((el) => (el as HTMLElement).style.setProperty("color", "rgb(1, 2, 3)"));
  await expect(locator, `${label} outline follows the text colour`).toHaveCSS("outline-color", ringColour);
  await locator.evaluate((el) => (el as HTMLElement).style.removeProperty("color"));
}

/** Checks every probe of a page against one theme's tokens. */
async function expectTheme(page: Page, probes: Probe[], theme: Theme) {
  const index = theme === "light" ? 0 : 1;
  await expectThemeClass(page, theme);
  for (const probe of probes) {
    const locator = subject(page, probe);
    await expect(locator, `${probe.name} is on the page`).toHaveCount(1);
    if (probe.focus) {
      await expect(locator, `${probe.name} has no outline before focus (${theme})`).toHaveCSS("outline-style", "none");
      await locator.focus();
    }
    for (const [property, tokens] of Object.entries(probe.props)) {
      const expected = await colourOf(page, tokens[index]!);
      await expect(locator, `${probe.name} ${property} (${theme}, --color-${tokens[index]})`).toHaveCSS(property, expected);
      if (probe.focus && property === "outline-color") {
        await expectRealRing(locator, expected, `${probe.name} (${theme})`);
      }
    }
    if (probe.focus) await locator.blur();
  }
}

/** A token pair that differs must resolve to two different colours, or the flip proves nothing. */
async function expectFlipsAreReal(page: Page, probes: Probe[]) {
  for (const probe of probes) {
    for (const [property, [light, dark]] of Object.entries(probe.props)) {
      const [lightColour, darkColour] = [await colourOf(page, light), await colourOf(page, dark)];
      if (light === dark) {
        expect(lightColour, `${probe.name} ${property} is meant to be the same in both themes`).toBe(darkColour);
      } else {
        expect(lightColour, `${probe.name} ${property}: --color-${light} and --color-${dark} are one colour`).not.toBe(darkColour);
      }
    }
  }
}

for (const { path, ready, probes } of PAGES) {
  for (const [from, to] of [
    ["light", "dark"],
    ["dark", "light"],
  ] as const) {
    test(`${path} resolves theme tokens, ${from} then ${to}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await setTheme(page, from);
      await page.goto(`${FIXTURE_SITE}${path}`);
      await ready(page);

      await expectTheme(page, probes, from);
      await expectFlipsAreReal(page, probes);

      // The class alone drives the change: no reload, no stored theme read again.
      await page.evaluate(() => document.documentElement.classList.toggle("dark"));
      await expectTheme(page, probes, to);
    });
  }
}

// Series and card outlines (spec 025 US3; FR-010, FR-011, FR-013, FR-017). Only a browser
// resolves the computed edge per theme. Tokens come from the stylesheet, not from literals.
test.describe("series and card outlines", () => {
  const seriesColour = (id: string) => findTopic(id)!.colour;

  for (const theme of ["light", "dark"] as const) {
    test(`/writing/ edges in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await setTheme(page, theme);
      await page.goto(`${FIXTURE_SITE}/writing/`);
      await expectThemeClass(page, theme);
      const dark = theme === "dark";

      await expect(page.locator("[data-series-intro-item]")).toHaveCount(2);
      for (const id of seriesIds) {
        const tile = page.locator(`[data-series-intro-item="${id}"]`);
        await expect(tile, `${id} tile border width`).toHaveCSS("border-top-width", dark ? "1px" : "0px");
        if (dark) {
          await expect(tile, `${id} tile border colour`).toHaveCSS("border-top-color", await colourOf(page, `${seriesColour(id)}-300`));
        }
      }

      const imageCard = page.locator("[data-post-card]:not([data-text-only])").first();
      await expect(imageCard).toBeVisible();
      await expect(imageCard).toHaveCSS("border-top-width", "1px");
      await expect(imageCard).toHaveCSS("border-top-color", await colourOf(page, dark ? "dusk-500" : "dusk-200"));

      const lead = page.locator("[data-lead-story]:not([data-text-only])");
      await expect(lead).toHaveCount(1);
      await expect(lead).toHaveCSS("border-top-width", "1px");
      await expect(lead).toHaveCSS("border-top-color", await colourOf(page, dark ? "dusk-500" : "dusk-200"));

      const textOnly = page.locator("[data-post-card][data-text-only]").first();
      if (await textOnly.count()) {
        await expect(textOnly).toHaveCSS("border-top-width", "2px");
        await expect(textOnly).not.toHaveCSS("border-top-color", await colourOf(page, "dusk-500"));
      }

      await expect(page.locator("[data-series-image]").first()).toHaveCSS("filter", "none");
      await expect(page.locator("[data-series-image]").first()).toHaveCSS("opacity", "1");
    });

    test(`series banner and topic banner edges in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await setTheme(page, theme);
      await page.goto(`${FIXTURE_SITE}/writing/${seriesIds[0]}/`);
      await expectThemeClass(page, theme);
      const banner = page.locator("[data-series-banner]");
      await expect(banner).toHaveCSS("border-top-width", theme === "dark" ? "1px" : "0px");
      if (theme === "dark") {
        await expect(banner).toHaveCSS("border-top-color", await colourOf(page, `${seriesColour(seriesIds[0]!)}-300`));
      }
      await expect(page.locator("[data-series-image]").first()).toHaveCSS("filter", "none");
      await expect(page.locator("[data-series-image]").first()).toHaveCSS("opacity", "1");

      await page.goto(`${FIXTURE_SITE}/writing/topics/${pillRowTopics[0]!.id}/`);
      await expectThemeClass(page, theme);
      await expect(page.locator("[data-topic-banner]")).toHaveCSS("border-top-width", "0px");
    });
  }
});
