import { describe, expect, it } from "vitest";
import { PageContentError, contentError } from "../../../src/lib/content/errors.ts";

describe("contentError", () => {
  it.each([
    ["page", "Page"],
    ["post", "Post"],
    ["project", "Project"],
  ] as const)("names one %s file in the message", (kind, label) => {
    const error = contentError(kind, `src/content/${kind}s/a.mdx`, "problem.");
    expect(error).toBeInstanceOf(PageContentError);
    expect(error.message).toBe(`${label} file src/content/${kind}s/a.mdx: problem.`);
  });

  it.each([
    ["page", "Page"],
    ["post", "Post"],
    ["project", "Project"],
  ] as const)("names two %s files in the message", (kind, label) => {
    const error = contentError(kind, ["a", "b"], "clash.");
    expect(error).toBeInstanceOf(PageContentError);
    expect(error.message).toBe(`${label} files a and b: clash.`);
  });
});

describe("contentError for architecture parts", () => {
  it("names the architecture part file", () => {
    expect(contentError("architecture part", "src/content/architecture/a.md", "problem.").message).toBe(
      "Architecture part file src/content/architecture/a.md: problem.",
    );
  });
});
