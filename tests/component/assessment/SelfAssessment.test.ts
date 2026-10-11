// Component tests for <SelfAssessment> (contracts/assessment-ui.md U1, U2, U18; FR-001 to FR-003).
import { describe, expect, it } from "vitest";
import SelfAssessment from "../../../src/components/assessment/SelfAssessment.astro";
import { statementSetVersion } from "../../../src/lib/assessment/version.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";
import { byName, tags } from "../html.ts";
import { render } from "../sections/helpers.ts";

const data = sampleAssessment();
const FILE = "src/content/posts/example.mdx";

// The dev-mode container adds data-astro-source attributes; the built page has none.
const html = (await render(SelfAssessment, { assessment: "sample", data }, undefined, { pageFile: FILE })).replace(
  / data-astro-source-(?:file|loc)="[^"]*"/g,
  "",
);

/** The element's inner HTML, from the first tag matching `open` to its closing tag (no nesting of the same name). */
const inner = (open: RegExp, name: string): string => {
  const start = open.exec(html);
  if (!start) throw new Error(`no ${open}`);
  const from = start.index + start[0].length;
  return html.slice(from, html.indexOf(`</${name}>`, from));
};
const textOfHtml = (fragment: string) => fragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const fieldsets = [...html.matchAll(/<fieldset\b[\s\S]*?<\/fieldset>/g)].map((m) => m[0]);

describe("SelfAssessment markup", () => {
  it("is one section named by the heading above it, carrying the statement set version", () => {
    const sections = byName(html, "section").filter((t) => "data-assessment" in t.attrs);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.attrs["data-assessment"]).toBe("sample");
    expect(sections[0]!.attrs["data-version"]).toBe(statementSetVersion(data.shifts));
    expect(sections[0]!.attrs["aria-labelledby"]).toMatch(/\S/);
  });

  it("has five shift groups of three statement fieldsets of five labelled radios (U2)", () => {
    expect(tags(html).filter((t) => t.attrs.role === "group")).toHaveLength(5);
    expect(fieldsets).toHaveLength(15);
    for (const fieldset of fieldsets) {
      const radios = byName(fieldset, "input").filter((t) => t.attrs.type === "radio");
      expect(radios.map((radio) => radio.attrs.value)).toEqual(["1", "2", "3", "4", "5"]);
      expect(new Set(radios.map((radio) => radio.attrs.name)).size).toBe(1);
      const labels = [...fieldset.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].map((m) => textOfHtml(m[1]!));
      expect(labels).toEqual(data.scale);
      expect(textOfHtml(/<legend\b[^>]*>([\s\S]*?)<\/legend>/.exec(fieldset)![1]!)).toMatch(/statement \d\./);
    }
  });

  it("names each group by its shift with an h3", () => {
    const groups = [...html.matchAll(/<div\b[^>]*role="group"[^>]*>[\s\S]*?<h3\b([^>]*)>([\s\S]*?)<\/h3>/g)];
    expect(groups.map((m) => textOfHtml(m[2]!))).toEqual(data.shifts.map((shift) => shift.name));
    const labelled = tags(html).filter((t) => t.attrs.role === "group").map((t) => t.attrs["aria-labelledby"]);
    const headingIds = groups.map((m) => /id="([^"]+)"/.exec(m[1]!)?.[1]);
    expect(labelled).toEqual(headingIds);
  });

  it("makes every button type=button so the form can never submit answers as a request (FR-016)", () => {
    const buttons = byName(html, "button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button.attrs.type).toBe("button");
    expect(byName(html, "form")[0]!.attrs.action).toBeUndefined();
  });

  it("lists every statement for readers without JavaScript (U18)", () => {
    const list = inner(/<div\b[^>]*data-assessment-nojs[^>]*>/, "ul").split("</div>")[0]!;
    expect(textOfHtml(list)).toMatch(/JavaScript/);
    const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => textOfHtml(m[1]!));
    expect(items).toEqual(data.shifts.flatMap((shift) => shift.statements));
    expect(list).not.toMatch(/<input|<button/);
  });

  it("has a polite status region and empty result and error containers", () => {
    expect(tags(html).some((t) => t.attrs.role === "status" && "data-assessment-status" in t.attrs)).toBe(true);
    expect(textOfHtml(inner(/<div\b[^>]*data-assessment-results[^>]*>/, "div"))).toBe("");
    expect(textOfHtml(inner(/<div\b[^>]*data-assessment-errors[^>]*>/, "div"))).toBe("");
  });

  it("carries one JSON data attribute with the text the browser needs and no answers", () => {
    const section = byName(html, "section").find((t) => "data-assessment" in t.attrs)!;
    const attribute = section.attrs["data-assessment-data"]!;
    const parsed = JSON.parse(attribute) as { shifts: { name: string; from: string; to: string; anchor: string }[]; scale: string[] };
    expect(parsed.shifts.map((shift) => [shift.name, shift.from, shift.to, shift.anchor])).toEqual(
      data.shifts.map((shift) => [shift.name, shift.from, shift.to, shift.anchor]),
    );
    expect(parsed.scale).toEqual(data.scale);
    expect(tags(html).filter((t) => t.name === "input" && "checked" in t.attrs)).toHaveLength(0);
  });
});
