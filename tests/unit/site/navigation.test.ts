// Unit tests for the site's navigation data (src/config/navigation.ts) and the
// current-page helper (src/lib/nav.ts) (data-model.md NavigationItem; research
// R4; FR-006, FR-009).
import { describe, expect, it } from "vitest";
import {
  fixedPrimaryNavigation,
  footerNavigation,
  socialNavigation,
} from "../../../src/config/navigation.ts";
import { isCurrent, isInSection } from "../../../src/lib/nav.ts";

describe("fixedPrimaryNavigation", () => {
  it("is exactly Writing 4, Projects 5 and Contact 7, sourced from the config file", () => {
    expect(fixedPrimaryNavigation.map(({ label, href, position, source }) => [label, href, position, source])).toEqual([
      ["Writing", "/writing/", 4, "src/config/navigation.ts"],
      ["Projects", "/projects/", 5, "src/config/navigation.ts"],
      ["Contact", "/contact/", 7, "src/config/navigation.ts"],
    ]);
  });

  it("marks every item as primary", () => {
    expect(fixedPrimaryNavigation.every((item) => item.kind === "primary")).toBe(true);
  });

});

describe("footerNavigation", () => {
  it("lists privacy policy, terms of use and technology", () => {
    expect(footerNavigation.map(({ label, href, kind }) => [label, href, kind])).toEqual([
      ["Privacy policy", "/privacy-policy/", "footer"],
      ["Terms of use", "/terms-of-use/", "footer"],
      ["Technology", "/technology/", "footer"],
    ]);
  });
});

describe("socialNavigation", () => {
  it("lists GitHub and LinkedIn", () => {
    expect(socialNavigation.map(({ label, href, kind }) => [label, href, kind])).toEqual([
      ["GitHub", "https://github.com/drcdev", "social"],
      ["LinkedIn", "https://www.linkedin.com/in/drcdev", "social"],
    ]);
  });
});

describe("every navigation item", () => {
  const all = [...fixedPrimaryNavigation, ...footerNavigation, ...socialNavigation];

  it("has a non-empty label", () => {
    for (const item of all) expect(item.label.trim()).not.toBe("");
  });

  it("uses an internal address that starts and ends with / or an https:// address", () => {
    for (const item of all) {
      if (item.kind === "social") expect(item.href).toMatch(/^https:\/\//);
      else expect(item.href).toMatch(/^\/(?:.*\/)?$/);
    }
  });
});

describe("isCurrent", () => {
  it("matches the same address", () => {
    expect(isCurrent("/services/", "/services/")).toBe(true);
  });

  it("normalises a missing trailing slash on either side", () => {
    expect(isCurrent("/services", "/services/")).toBe(true);
    expect(isCurrent("/services/", "/services")).toBe(true);
  });

  it("matches / only for the home page", () => {
    expect(isCurrent("/", "/")).toBe(true);
    expect(isCurrent("", "/")).toBe(true);
    expect(isCurrent("/services/", "/")).toBe(false);
    expect(isCurrent("/", "/services/")).toBe(false);
  });

  it("does not treat a child or look-alike address as current", () => {
    expect(isCurrent("/writing/some-post/", "/writing/")).toBe(false);
    expect(isCurrent("/services-extra/", "/services/")).toBe(false);
    expect(isCurrent("/projects/example-project/", "/projects/")).toBe(false);
  });
});

describe("isInSection", () => {
  it("is true for the section address and every address below it", () => {
    expect(isInSection("/writing/", "/writing/")).toBe(true);
    expect(isInSection("/writing", "/writing/")).toBe(true);
    expect(isInSection("/writing/some-post/", "/writing/")).toBe(true);
    expect(isInSection("/writing/all/2/", "/writing/")).toBe(true);
    expect(isInSection("/writing/topics/agentic-ai/", "/writing/")).toBe(true);
    expect(isInSection("/projects/", "/projects/")).toBe(true);
    expect(isInSection("/projects/example-project/", "/projects/")).toBe(true);
    expect(isInSection("/projects/example-project", "/projects/")).toBe(true);
  });

  it("is false elsewhere, including look-alike addresses", () => {
    expect(isInSection("/", "/writing/")).toBe(false);
    expect(isInSection("/services/", "/writing/")).toBe(false);
    expect(isInSection("/writing-tips/", "/writing/")).toBe(false);
    expect(isInSection("/about/writing/", "/writing/")).toBe(false);
    expect(isInSection("/projects-old/", "/projects/")).toBe(false);
    expect(isInSection("/project/", "/projects/")).toBe(false);
  });

  it("never treats / as a section that holds every address", () => {
    expect(isInSection("/services/", "/")).toBe(false);
    expect(isInSection("/", "/")).toBe(true);
    expect(isInSection("/projects/example-project/", "/")).toBe(false);
  });
});
