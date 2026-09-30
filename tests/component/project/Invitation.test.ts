import { describe, expect, it } from "vitest";
import Invitation from "../../../src/components/project/blocks/Invitation.astro";
import { byName } from "../html.ts";
import { renderWithProject } from "./helpers.ts";

describe("Invitation", () => {
  it("links to the contact form with the project slug and the title in its name", async () => {
    const html = await renderWithProject(Invitation);
    const [a] = byName(html, "a");
    expect(a!.attrs.href).toBe("/contact/?project=focus-pocus");
    expect(a!.attrs["data-invitation"]).toBeDefined();
    expect(html).toContain("Focus Pocus");
  });

  it("is a plain same-tab link with no script", async () => {
    const html = await renderWithProject(Invitation);
    expect(byName(html, "a")[0]!.attrs.target).toBeUndefined();
    expect(byName(html, "script")).toHaveLength(0);
    expect(byName(html, "button")).toHaveLength(0);
  });
});
