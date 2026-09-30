// Unit tests for scripts/deploy/preview.ts (specs/007-contact-form/contracts/worker-config.md
// "Deploy scripts"). The pure step builder is tested without spawning anything.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { previewDeploySteps } from "../../../scripts/deploy/preview.ts";

describe("previewDeploySteps", () => {
  it("applies preview migrations first, deploys the preview env, then uploads an aliased version", () => {
    expect(previewDeploySteps({ WORKERS_CI_BRANCH: "002-site-foundation" })).toEqual([
      ["d1", "migrations", "apply", "contact-preview", "--remote", "--env", "preview"],
      ["deploy", "--env", "preview"],
      ["versions", "upload", "--env", "preview", "--preview-alias", "br-002-site-foundation"],
    ]);
  });

  it("skips the aliased upload on main", () => {
    expect(previewDeploySteps({ WORKERS_CI_BRANCH: "main" })).toEqual([
      ["d1", "migrations", "apply", "contact-preview", "--remote", "--env", "preview"],
      ["deploy", "--env", "preview"],
    ]);
  });

  it("never names the production database", () => {
    const flat = previewDeploySteps({ WORKERS_CI_BRANCH: "feature-x" }).flat();
    expect(flat).not.toContain("contact");
  });

  it("accepts WRANGLER_CI_OVERRIDE_NAME when it is dcc-web-preview", () => {
    expect(() =>
      previewDeploySteps({ WORKERS_CI_BRANCH: "x", WRANGLER_CI_OVERRIDE_NAME: "dcc-web-preview" }),
    ).not.toThrow();
  });

  it("refuses when WRANGLER_CI_OVERRIDE_NAME names another Worker", () => {
    expect(() =>
      previewDeploySteps({ WORKERS_CI_BRANCH: "x", WRANGLER_CI_OVERRIDE_NAME: "dcc-web" }),
    ).toThrow(/WRANGLER_CI_OVERRIDE_NAME/);
  });

  it("throws a plain-language error when WORKERS_CI_BRANCH is missing", () => {
    expect(() => previewDeploySteps({})).toThrow(/WORKERS_CI_BRANCH/);
  });

  it("throws a plain-language error when the branch's alias would be null", () => {
    expect(() => previewDeploySteps({ WORKERS_CI_BRANCH: "---" })).toThrow(/alias/i);
  });
});

describe("scripts/deploy/preview.ts run as a child process", () => {
  const scriptPath = fileURLToPath(new URL("../../../scripts/deploy/preview.ts", import.meta.url));

  it("exits non-zero and prints no environment values when misconfigured", () => {
    const secretLikeValue = "should-never-be-printed-zzq9";
    const result = spawnSync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        WORKERS_CI_BRANCH: "feature-x",
        WRANGLER_CI_OVERRIDE_NAME: secretLikeValue,
      },
      encoding: "utf-8",
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout ?? ""}${result.stderr ?? ""}`).not.toContain(secretLikeValue);
  });
});

describe("docs/setup.md {#workers-builds}", () => {
  const setupMdPath = fileURLToPath(new URL("../../../docs/setup.md", import.meta.url));
  const contents = readFileSync(setupMdPath, "utf-8");
  const sectionStart = contents.indexOf("{#workers-builds}");
  const nextSectionStart = contents.indexOf("\n## ", sectionStart);
  const section = contents.slice(sectionStart, nextSectionStart === -1 ? undefined : nextSectionStart);

  it("exists", () => {
    expect(sectionStart).toBeGreaterThan(-1);
  });

  it("names pnpm run deploy:preview as the preview Worker's deploy command", () => {
    expect(section).toContain("pnpm run deploy:preview");
    expect(section).toContain("dcc-web-preview");
  });

  it("says the build command stays pnpm run build and points to the production deploy command", () => {
    expect(section).toMatch(/build command[^.]*unchanged/i);
    expect(section).toContain("pnpm run deploy:production");
  });

  it("says dcc-web no longer builds non-production branches", () => {
    expect(section).toMatch(/non-production[^.]*off|off[^.]*non-production/i);
  });
});
