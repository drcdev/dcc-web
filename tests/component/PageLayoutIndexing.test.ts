// A draft standalone page is noindex even in the indexable (main) build; a published page is
// indexable there (contracts/indexing-and-origin.md "Robots meta tag (by build)"; FR-010d).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, it, vi } from "vitest";
import { meta } from "./html.ts";

afterEach(() => {
  vi.doUnmock("astro:env/server");
  vi.resetModules();
});

async function renderMain(draft: boolean) {
  vi.resetModules();
  vi.doMock("astro:env/server", () => ({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" }));
  const { default: PageLayout } = await import("../../src/layouts/PageLayout.astro");
  const container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
  return container.renderToString(PageLayout, {
    partial: false,
    props: { title: "Workshops", description: "About workshops.", navigation: { header: [], footer: [] }, draft },
    request: new Request("https://example.test/workshops/"),
    slots: { default: "<p>Body text.</p>" },
  });
}

describe("PageLayout robots meta in a main build", () => {
  it("is noindex for a draft page", async () => {
    const html = await renderMain(true);
    expect(meta(html, "name", "robots")[0]?.attrs.content).toBe("noindex");
  });

  it("has no robots meta for a published page", async () => {
    const html = await renderMain(false);
    expect(meta(html, "name", "robots")).toHaveLength(0);
  });
});
