// Unit tests for the one file-format rule: a file with a body is .mdx, a file without one is .yaml
// (issue #200). The sync runs in tests/build prove each loader calls the check.
import { describe, expect, it } from "vitest";
import { PageContentError, type ErrorKind } from "../../../src/lib/content/errors.ts";
import { assertFileFormat } from "../../../src/lib/content/file-format.ts";

const MDX: [ErrorKind, string, string][] = [
  ["page", "src/content/pages/about", "a page"],
  ["post", "src/content/posts/hello", "a post"],
  ["project", "src/content/projects/tempo", "a project"],
  ["now", "src/content/now/now", "the Now file"],
];
const YAML: [ErrorKind, string, string][] = [
  ["career step", "src/content/career/01-first-role", "a career step"],
  ["reading path", "src/content/reading-paths/start", "a reading path"],
  ["assessment", "src/content/assessments/sample", "an assessment"],
];

describe("assertFileFormat", () => {
  it.each(MDX)("accepts .mdx for %s", (kind, stem) => {
    expect(() => assertFileFormat(kind, `${stem}.mdx`)).not.toThrow();
  });

  it.each(YAML)("accepts .yaml for %s", (kind, stem) => {
    expect(() => assertFileFormat(kind, `${stem}.yaml`)).not.toThrow();
  });

  it.each(MDX)("rejects .md for %s, naming the file and saying to rename it to .mdx", (kind, stem, noun) => {
    const run = () => assertFileFormat(kind, `${stem}.md`);
    expect(run).toThrow(PageContentError);
    expect(run).toThrow(`${stem}.md`);
    expect(run).toThrow(`${noun} must be an .mdx file, so rename it to .mdx.`);
  });

  it.each(YAML)("rejects .yml for %s, naming the file and saying to rename it to .yaml", (kind, stem, noun) => {
    const run = () => assertFileFormat(kind, `${stem}.yml`);
    expect(run).toThrow(PageContentError);
    expect(run).toThrow(`${stem}.yml`);
    expect(run).toThrow(`${noun} must be a .yaml file, so rename it to .yaml.`);
  });

  it("keeps the post message exactly", () => {
    expect(() => assertFileFormat("post", "src/content/posts/x.md")).toThrow(
      "Post file src/content/posts/x.md: a post must be an .mdx file, so rename it to .mdx.",
    );
  });
});
