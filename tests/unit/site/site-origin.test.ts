// Unit tests for the pure site-origin resolver (contracts/site-origin.md).
// src/lib/site-origin.ts does not exist yet — this is seen failing first.
import { describe, expect, it } from "vitest";
import { FALLBACK_ORIGIN, previewAlias, resolveSiteOrigin } from "../../../src/lib/site-origin.ts";

const baseConfig = {
  reviewHost: "new.doncoleman.ca",
  workerName: "dcc-web",
  previewWorkerName: "dcc-web-preview",
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
    expect(origin).toBe("https://br-002-site-foundation-dcc-web-preview.drc-agents.workers.dev");
  });

  it("matches the preview address pattern https://<alias>-dcc-web-preview.<subdomain>.workers.dev", () => {
    const origin = resolveSiteOrigin(
      { WORKERS_CI: "1", WORKERS_CI_BRANCH: "Feature/Nav_Fix" },
      baseConfig,
    );
    expect(origin).toBe("https://feature-nav-fix-dcc-web-preview.drc-agents.workers.dev");
  });

  it("falls back when previewWorkerName is missing", () => {
    const { previewWorkerName, ...withoutPreview } = baseConfig;
    void previewWorkerName;
    expect(
      resolveSiteOrigin({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "feature-x" }, withoutPreview),
    ).toBe(FALLBACK_ORIGIN);
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

  it("truncates to 47 characters and trims a trailing dash", () => {
    const longBranch = "a".repeat(80);
    const alias = previewAlias(longBranch);
    expect(alias).not.toBeNull();
    expect(alias!.length).toBe(47);
    expect(previewAlias("a".repeat(46) + "-bbbbbb")!.length).toBe(46);
    expect(alias!.endsWith("-")).toBe(false);
  });
});
