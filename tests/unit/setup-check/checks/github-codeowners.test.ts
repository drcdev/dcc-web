import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/github-codeowners.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, loadFixture } from "./test-helpers.ts";

const CONFIG = { owner: "drcdev", repo: "dcc-web" };

const VALID_CODEOWNERS = `
# Every PR needs Don.
* @drcdev
`;

function fs(codeowners: string | null) {
  return {
    readText: ((path: string) => (path === ".github/CODEOWNERS" ? codeowners : null)) as never,
    readJson: (() => CONFIG) as never,
  };
}

describe("checks/github-codeowners", () => {
  it("is missing when .github/CODEOWNERS does not exist", async () => {
    const ctx = fakeProviderContext({ fs: fs(null) });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
  });

  it("is missing when the catch-all line is missing", async () => {
    const ctx = fakeProviderContext({ fs: fs("/docs/ @drcdev\n") });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.nextAction).toContain("* @drcdev");
  });

  it("is missing when GitHub reports CODEOWNERS errors", async () => {
    const errors = loadFixture("github", "codeowners-errors");
    const ctx = fakeProviderContext({
      fs: fs(VALID_CODEOWNERS),
      github: { api: (async () => errors) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/error/i);
  });

  it("is complete when the catch-all line names @drcdev and GitHub reports no errors", async () => {
    const errors = loadFixture("github", "codeowners-valid");
    const ctx = fakeProviderContext({
      fs: fs(VALID_CODEOWNERS),
      github: { api: (async () => errors) as never },
    });

    const result = await check(ctx);

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 11 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#github-codeowners");
  });

  it("is could-not-check when the gh api call fails", async () => {
    const ctx = fakeProviderContext({
      fs: fs(VALID_CODEOWNERS),
      github: {
        api: async () => {
          throw new ProviderAccessError("gh is not signed in as Don; run gh auth login and try again");
        },
      },
    });

    const result = await check(ctx);

    expect(result.status).toBe("could-not-check");
  });
});
