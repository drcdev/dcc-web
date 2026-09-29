// Unit tests for scripts/deploy/preview.ts (contracts/site-origin.md "pnpm run
// deploy:preview"). The module does not exist yet — seen failing first.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { previewUploadArgs } from "../../../scripts/deploy/preview.ts";

describe("previewUploadArgs", () => {
  it("builds the versions upload args with the branch's preview alias", () => {
    expect(previewUploadArgs({ WORKERS_CI_BRANCH: "002-site-foundation" })).toEqual([
      "versions",
      "upload",
      "--preview-alias",
      "br-002-site-foundation",
    ]);
  });

  it("throws a plain-language error when WORKERS_CI_BRANCH is missing", () => {
    expect(() => previewUploadArgs({})).toThrow(/WORKERS_CI_BRANCH/);
  });

  it("throws a plain-language error when the branch is main", () => {
    expect(() => previewUploadArgs({ WORKERS_CI_BRANCH: "main" })).toThrow(/main/i);
  });

  it("throws a plain-language error when the branch's alias would be null", () => {
    expect(() => previewUploadArgs({ WORKERS_CI_BRANCH: "---" })).toThrow(/alias/i);
  });
});

describe("scripts/deploy/preview.ts run as a child process", () => {
  const scriptPath = fileURLToPath(new URL("../../../scripts/deploy/preview.ts", import.meta.url));

  it("exits non-zero and prints no environment values when the branch is missing", () => {
    const secretLikeValue = "should-never-be-printed-zzq9";
    const result = spawnSync(process.execPath, [scriptPath], {
      env: { ...process.env, WORKERS_CI_BRANCH: "", DEPLOY_PREVIEW_TEST_SECRET: secretLikeValue },
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

  it("names pnpm run deploy:preview as the non-production branch deploy command", () => {
    expect(section).toContain("pnpm run deploy:preview");
  });

  it("says the build command and production deploy command are unchanged", () => {
    expect(section).toMatch(/build command[^.]*unchanged/i);
    expect(section).toMatch(/production deploy[^.]*unchanged/i);
  });
});
