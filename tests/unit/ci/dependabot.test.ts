import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = fileURLToPath(new URL("../../../.github/dependabot.yml", import.meta.url));

/** The file with comment lines removed, so a comment cannot satisfy or break an assertion. */
function config(): string {
  return readFileSync(path, "utf-8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");
}

describe("dependabot.yml", () => {
  it("exists", () => {
    expect(existsSync(path)).toBe(true);
  });

  it("uses config version 2", () => {
    expect(config()).toMatch(/^version:\s*2\s*$/m);
  });

  it("updates exactly one ecosystem, github-actions at the repository root", () => {
    const ecosystems = [...config().matchAll(/package-ecosystem:\s*"?([^"\s]+)"?/g)].map((m) => m[1]);
    expect(ecosystems).toEqual(["github-actions"]);
    expect(config()).toMatch(/directory:\s*"\/"/);
  });

  it("does not update npm", () => {
    expect(config()).not.toMatch(/package-ecosystem:\s*"?npm"?/);
  });

  it("runs monthly", () => {
    expect(config()).toMatch(/interval:\s*"monthly"/);
  });

  it("groups every update into one pull request", () => {
    const text = config();
    expect(text).toMatch(/^\s+groups:\s*$/m);
    expect(text).toMatch(/patterns:\s*\n\s+- "\*"/);
  });
});
