import { describe, expect, it } from "vitest";
import ProjectInvitation from "../../../src/components/project/ProjectInvitation.astro";
import { byName } from "../html.ts";
import { render } from "../sections/helpers.ts";
import { makeProject, renderWithProject } from "./helpers.ts";

const STANDARD = "If you are working on a similar problem, I would like to hear about it.";

const invitation = (data: Record<string, unknown> = {}) =>
  renderWithProject(ProjectInvitation, {}, undefined, makeProject(data));

describe("ProjectInvitation", () => {
  it("is a footer block holding the sentence and one contact link", async () => {
    const html = await invitation();
    expect(byName(html, "footer")[0]!.attrs["data-invitation-block"]).toBeDefined();
    expect(byName(html, "p").some((p) => "data-invitation-text" in p.attrs)).toBe(true);
    expect(byName(html, "a")).toHaveLength(1);
  });

  it("shows the standard sentence when the project has no invitation", async () => {
    expect(await invitation()).toContain(STANDARD);
  });

  it("shows the project's own sentence instead of the standard one", async () => {
    const html = await invitation({ invitation: "If you have a similar OmniFocus problem, tell me." });
    expect(html).toContain("If you have a similar OmniFocus problem, tell me.");
    expect(html).not.toContain(STANDARD);
  });

  it("shows the standard sentence when the invitation is empty text", async () => {
    // The schema turns empty text into no value; the component also treats a blank string as none.
    expect(await invitation({ invitation: "" })).toContain(STANDARD);
    expect(await invitation({ invitation: undefined })).toContain(STANDARD);
  });

  it("links to the contact form carrying only the slug, with the title in the link text", async () => {
    const html = await invitation();
    const [a] = byName(html, "a");
    expect(a!.attrs.href).toBe("/contact/?project=focus-pocus");
    expect(a!.attrs["data-invitation"]).toBeDefined();
    expect(html).toContain("Tell me about a problem like Focus Pocus");
    expect(a!.attrs.target).toBeUndefined();
  });

  it("uses no script and no button", async () => {
    const html = await invitation();
    expect(byName(html, "script")).toHaveLength(0);
    expect(byName(html, "button")).toHaveLength(0);
  });

  it("throws when the route has not provided a project", async () => {
    await expect(render(ProjectInvitation)).rejects.toThrow(/project/i);
  });
});
