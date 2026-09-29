// Unit tests for the pure site-origin resolver (contracts/site-origin.md).
// src/lib/site-origin.ts does not exist yet — this is seen failing first.
import { describe, expect, it } from "vitest";
import { FALLBACK_ORIGIN, previewAlias, resolveSiteOrigin } from "../../../src/lib/site-origin.ts";

const baseConfig = {
  reviewHost: "new.doncoleman.ca",
  workerName: "dcc-web",
  workersSubdomain: "drc-agents",
};

describe("FALLBACK_ORIGIN", () => {
  it("is https://doncoleman.ca", () => {
    expect(FALLBACK_ORIGIN).toBe("https://doncoleman.ca");
  });
});

describe("resolveSiteOrigin", () => {
  it("resolves to the reviewHost when WORKERS_CI=1 and branch is main", () => {
    const origin = resolveSiteOrigin({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" }, baseConfig);
    expect(origin).toBe("https://new.doncoleman.ca");
  });

  it("resolves to the aliased workers.dev origin for another branch when workersSubdomain is set", () => {
    const origin = resolveSiteOrigin(
      { WORKERS_CI: "1", WORKERS_CI_BRANCH: "002-site-foundation" },
      baseConfig,
    );
    expect(origin).toBe("https://br-002-site-foundation-dcc-web.drc-agents.workers.dev");
  });

  it("falls back when the branch alias would be null", () => {
    const origin = resolveSiteOrigin({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "---" }, baseConfig);
    expect(origin).toBe(FALLBACK_ORIGIN);
  });

  it("falls back when workersSubdomain is missing", () => {
    const { workersSubdomain, ...configWithoutSubdomain } = baseConfig;
    void workersSubdomain;
    const origin = resolveSiteOrigin(
      { WORKERS_CI: "1", WORKERS_CI_BRANCH: "feature-x" },
      configWithoutSubdomain,
    );
    expect(origin).toBe(FALLBACK_ORIGIN);
  });

  it("falls back when WORKERS_CI is unset", () => {
    expect(resolveSiteOrigin({}, baseConfig)).toBe(FALLBACK_ORIGIN);
  });

  it("falls back when WORKERS_CI is set but not '1'", () => {
    expect(resolveSiteOrigin({ WORKERS_CI: "0", WORKERS_CI_BRANCH: "main" }, baseConfig)).toBe(
      FALLBACK_ORIGIN,
    );
  });

  it("falls back on an invalid config (bad reviewHost)", () => {
    const origin = resolveSiteOrigin(
      { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
      { ...baseConfig, reviewHost: "" },
    );
    expect(origin).toBe(FALLBACK_ORIGIN);
  });
});

describe("previewAlias", () => {
  it("slugifies a Spec Kit branch and prefixes br- because it starts with a digit", () => {
    expect(previewAlias("002-site-foundation")).toBe("br-002-site-foundation");
  });

  it("lowercases and replaces non-alphanumeric runs with a single dash", () => {
    expect(previewAlias("Feature/Nav_Fix")).toBe("feature-nav-fix");
  });

  it("returns null for a branch with no usable characters", () => {
    expect(previewAlias("---")).toBeNull();
  });

  it("truncates to 55 characters and trims a trailing dash", () => {
    const longBranch = "a".repeat(80);
    const alias = previewAlias(longBranch);
    expect(alias).not.toBeNull();
    expect(alias!.length).toBeLessThanOrEqual(55);
    expect(alias!.endsWith("-")).toBe(false);
  });
});
