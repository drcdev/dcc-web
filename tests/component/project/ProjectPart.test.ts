import { describe, expect, it } from "vitest";
import ProjectPart from "../../../src/components/project/ProjectPart.astro";
import { byName } from "../html.ts";
import { render } from "../sections/helpers.ts";
import { makeProject, renderWithProject } from "./helpers.ts";

const heading = (id: string, text: string) => `<h2 id="${id}">${text}</h2><p>Body text.</p>`;

const part = (name: string, project = makeProject()) =>
  renderWithProject(ProjectPart, { name }, heading(name, "Heading"), project);

describe("ProjectPart", () => {
  it("renders one section named for the part, labelled by the part heading", async () => {
    const html = await part("problem");
    const sections = byName(html, "section");
    expect(sections).toHaveLength(1);
    expect(sections[0]!.attrs["data-part"]).toBe("problem");
    expect(sections[0]!.attrs["aria-labelledby"]).toBe("problem");
    expect(html).toContain('id="problem"');
    expect(html).toContain("Body text.");
  });

  it("puts the writer's text in the text column with the post prose classes", async () => {
    const html = await part("problem");
    const [text] = byName(html, "div").filter((d) => "data-part-text" in d.attrs);
    expect(text).toBeDefined();
    expect(text!.attrs.class).toMatch(/\bprose\b/);
    expect(text!.attrs.class).toMatch(/lg:prose-lg/);
    expect(text!.attrs.class).toMatch(/dark:prose-invert/);
    expect(text!.attrs.class).toMatch(/prose-accent/);
  });

  it("has no picture column and no chapter, stage or reveal hooks when no picture is assigned", async () => {
    const html = await part("problem");
    expect(byName(html, "section")[0]!.attrs["data-has-picture"]).toBe("false");
    expect(byName(html, "figure")).toHaveLength(0);
    expect(html).not.toMatch(/data-chapter|data-reveal|data-stage|Chapter \d/);
  });

  it("renders the picture assigned to the part beside the text", async () => {
    const html = await part("build");
    expect(byName(html, "section")[0]!.attrs["data-has-picture"]).toBe("true");
    const figures = byName(html, "figure");
    expect(figures).toHaveLength(1);
    expect(figures[0]!.attrs["data-part-picture"]).toBeDefined();
    expect(figures[0]!.attrs["data-visual"]).toBe("image");
    expect(byName(html, "img")[0]!.attrs.alt).toBe("A screenshot of the tool");
    // The picture column follows the text column in the source, so a phone shows it below the text.
    expect(html.indexOf("data-part-text")).toBeLessThan(html.indexOf("data-part-picture"));
  });

  it("renders a diagram assigned to the part with its description", async () => {
    const html = await part("options");
    expect(byName(html, "figure")[0]!.attrs["data-visual"]).toBe("diagram");
    expect(html).toContain("Three boxes in a row.");
  });

  it("loads the first picture on the page eagerly and every later one lazily", async () => {
    // Options holds the first assigned picture (problem has none), so it is eager; Build comes later.
    expect(byName(await part("options"), "img")[0]!.attrs.loading).toBe("eager");
    expect(byName(await part("build"), "img")[0]!.attrs.loading).toBe("lazy");
  });

  it("loads a part's picture eagerly when it is the first part with a picture", async () => {
    const project = makeProject({
      visuals: {
        first: { kind: "image", src: { src: "/_astro/a.png", width: 8, height: 8, format: "png" }, alt: "First", part: "problem" },
        second: { kind: "image", src: { src: "/_astro/b.png", width: 8, height: 8, format: "png" }, alt: "Second", part: "lessons" },
      },
    });
    expect(byName(await part("problem", project), "img")[0]!.attrs.loading).toBe("eager");
    expect(byName(await part("lessons", project), "img")[0]!.attrs.loading).toBe("lazy");
  });

  it("shows no links block in Build when the project has no demo, stand-in or source", async () => {
    const html = await part("build");
    expect(html).not.toContain("data-build-links");
    expect(byName(html, "a")).toHaveLength(0);
  });

  it("shows the Build links after the Build text when the project has any of them", async () => {
    const html = await part("build", makeProject({ source: "https://github.com/drcdev/focus-pocus" }));
    const [list] = byName(html, "ul");
    expect(list!.attrs["data-build-links"]).toBeDefined();
    expect(html).toContain("Source code for Focus Pocus");
    expect(html.indexOf("Body text.")).toBeLessThan(html.indexOf("data-build-links"));
  });

  it("shows the Build links only in the Build part", async () => {
    const html = await part("lessons", makeProject({ source: "https://github.com/drcdev/focus-pocus" }));
    expect(html).not.toContain("data-build-links");
  });

  it("names the project in each link and opens every link in the same tab (FR-008)", async () => {
    const html = await part(
      "build",
      makeProject({
        demo: { href: "https://demo.drc.dev/fp" },
        source: "https://github.com/drcdev/focus-pocus",
      }),
    );
    const links = byName(html, "a");
    expect(links.map((a) => a.attrs.href)).toEqual(["https://demo.drc.dev/fp", "https://github.com/drcdev/focus-pocus"]);
    expect(html).toContain("Open the Focus Pocus demo");
    expect(html).toContain("Source code for Focus Pocus");
    for (const a of links) expect(a.attrs.target).toBeUndefined();
  });

  it("links to a stand-in with the not-a-live-demo note", async () => {
    const html = await part(
      "build",
      makeProject({ standIn: { href: "https://drc.dev/projects/focus-pocus", label: "Focus Pocus on drc.dev" } }),
    );
    expect(html).toContain("Focus Pocus on drc.dev");
    expect(html).toContain("This is not a live demo.");
  });

  it("uses no iframe and no script", async () => {
    const html = await part("build", makeProject({ demo: { href: "https://demo.drc.dev/fp" } }));
    expect(byName(html, "iframe")).toHaveLength(0);
    expect(byName(html, "script")).toHaveLength(0);
  });

  it("throws for a part that is not one of the four", async () => {
    await expect(part("epilogue")).rejects.toThrow(/epilogue/);
  });

  it("throws when the route has not provided a project", async () => {
    await expect(render(ProjectPart, { name: "problem" }, heading("problem", "Problem"))).rejects.toThrow(/project/i);
  });
});
