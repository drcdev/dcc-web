// Unit tests for the site's navigation data (src/config/navigation.ts) and the
// current-page helper (src/lib/nav.ts) (data-model.md NavigationItem; research
// R4; FR-006, FR-009).
import { describe, expect, it } from "vitest";
import {
  footerNavigation,
  futureDestinations,
  primaryNavigation,
  socialNavigation,
} from "../../../src/config/navigation.ts";
import { isCurrent } from "../../../src/lib/nav.ts";

describe("primaryNavigation", () => {
  it("lists the seven primary items in order with their final addresses", () => {
    expect(primaryNavigation.map(({ label, href }) => [label, href])).toEqual([
      ["Home", "/"],
      ["Services", "/services/"],
      ["Speaking", "/speaking/"],
      ["Writing", "/writing/"],
      ["Projects", "/projects/"],
      ["About", "/about/"],
      ["Contact", "/contact/"],
    ]);
  });

  it("marks every item as primary", () => {
    expect(primaryNavigation.every((item) => item.kind === "primary")).toBe(true);
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
  const all = [...primaryNavigation, ...footerNavigation, ...socialNavigation];

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

describe("futureDestinations", () => {
  it("lists every internal navigation address that no page builds yet", () => {
    expect([...futureDestinations].sort()).toEqual(
      [
        "/services/",
        "/speaking/",
        "/writing/",
        "/projects/",
        "/about/",
        "/contact/",
        "/privacy-policy/",
        "/terms-of-use/",
        "/technology/",
      ].sort(),
    );
  });

  it("does not include the home page, which is built", () => {
    expect(futureDestinations).not.toContain("/");
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
  });
});
