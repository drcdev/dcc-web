// Prototype CSP and design-token guard (FR-005, FR-050): no inline styles, no
// iframes, no external images or hosts beyond drc.dev and the GitHub repo, and
// no colour literals, font declarations or new colour/font custom properties.
// Each direction's component test task extends COMPONENTS below.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import { render } from "../../sections/helpers.ts";
import { byName, tags } from "../../html.ts";
import PrototypeNotice from "../../../../src/prototypes/portfolio/shared/PrototypeNotice.astro";
import DraftMark from "../../../../src/prototypes/portfolio/shared/DraftMark.astro";
import PlaceholderFrame from "../../../../src/prototypes/portfolio/shared/PlaceholderFrame.astro";
import ArchitectureDiagram from "../../../../src/prototypes/portfolio/shared/ArchitectureDiagram.astro";
import OptionsDiagram from "../../../../src/prototypes/portfolio/shared/OptionsDiagram.astro";
import StatusBadge from "../../../../src/prototypes/portfolio/shared/StatusBadge.astro";
import ThemePills from "../../../../src/prototypes/portfolio/shared/ThemePills.astro";
import PortfolioFilter from "../../../../src/prototypes/portfolio/shared/PortfolioFilter.astro";
import StageSection from "../../../../src/prototypes/portfolio/shared/StageSection.astro";
import OptionDetails from "../../../../src/prototypes/portfolio/a/OptionDetails.astro";
import TimelineStage from "../../../../src/prototypes/portfolio/a/TimelineStage.astro";
import TimelineStory from "../../../../src/prototypes/portfolio/a/TimelineStory.astro";
import TimelineIndex from "../../../../src/prototypes/portfolio/a/TimelineIndex.astro";
import { allEntries, focusPocus } from "../../../../src/prototypes/portfolio/sample.ts";

interface Entry {
  name: string;
  component: AstroComponentFactory;
  props?: Record<string, unknown>;
  slot?: string;
}

const diagram = { label: "Label", description: "Description.", idPrefix: "g" };

// Extend this list as each direction lands (T025, T038, T053).
const COMPONENTS: Entry[] = [
  { name: "PrototypeNotice", component: PrototypeNotice },
  { name: "DraftMark", component: DraftMark },
  {
    name: "PlaceholderFrame",
    component: PlaceholderFrame,
    props: { media: "clip", label: "Clip", description: "A short clip." },
  },
  { name: "ArchitectureDiagram", component: ArchitectureDiagram, props: diagram },
  { name: "OptionsDiagram", component: OptionsDiagram, props: diagram },
  { name: "StatusBadge", component: StatusBadge, props: { status: "shipped" } },
  { name: "ThemePills", component: ThemePills, props: { themes: ["Web"] } },
  { name: "PortfolioFilter", component: PortfolioFilter, props: { entries: allEntries }, slot: "<ul></ul>" },
  { name: "A OptionDetails", component: OptionDetails, props: { option: focusPocus.options[2] } },
  { name: "A TimelineStage", component: TimelineStage, props: { stage: focusPocus.stages[3], number: 4 } },
  { name: "A TimelineStory", component: TimelineStory, props: { story: focusPocus } },
  { name: "A TimelineIndex", component: TimelineIndex, props: { entries: allEntries } },
  ...focusPocus.stages.map((stage) => ({
    name: `StageSection ${stage.id}`,
    component: StageSection as AstroComponentFactory,
    props: { stage },
  })),
];

const ALLOWED_URL = /^https:\/\/(drc\.dev\/|github\.com\/drcdev\/)/;

describe("rendered prototype components", () => {
  it.each(COMPONENTS.map((c) => [c.name, c] as const))("%s is CSP-safe", async (_name, c) => {
    const html = await render(c.component, c.props ?? {}, c.slot);
    expect(tags(html).some((t) => "style" in t.attrs)).toBe(false);
    expect(byName(html, "iframe")).toHaveLength(0);
    for (const img of byName(html, "img")) expect(img.attrs.src ?? "").not.toMatch(/^(https?:)?\/\//);
    const urls = [...html.matchAll(/(?:https?:)?\/\/[^\s"'<>)]+/g)].map((m) => m[0]);
    for (const url of urls) expect(url, `external URL in ${c.name}`).toMatch(ALLOWED_URL);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(css|astro)$/.test(name) ? [path] : [];
  });
}

describe("prototype source files use only the site's tokens", () => {
  const files = sourceFiles("src/prototypes/portfolio");
  it("finds source files", () => {
    expect(files.length).toBeGreaterThan(0);
  });
  it.each(files.map((f) => [f] as const))("%s has no colour literals or font declarations", (file) => {
    const source = readFileSync(file, "utf-8");
    expect(source, "hex colour").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source, "colour function").not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb|color)\(/);
    expect(source, "font-family").not.toMatch(/font-family\s*:/);
    expect(source, "@font-face").not.toMatch(/@font-face/);
    expect(source, "new colour or font token").not.toMatch(/--(color|font)-[\w-]+\s*:/);
    expect(source, "inline style").not.toMatch(/\sstyle\s*=/);
  });
});
