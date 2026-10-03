// The project parts plugin (specs/014-project-four-part-story/research.md R2; FR-002, FR-006, FR-016).
// A Sätteri mdast plugin wraps each level-2 heading and the siblings after it in a `ProjectPart`
// element and swaps the table in the Options part for an `OptionsTable` element. It does nothing for
// a file outside src/content/projects/, so posts and pages are untouched. The compiled JavaScript is
// read, because that is what reaches `<Content components>` (the build test checks the page).
import { mdxToJs } from "satteri";
import { describe, expect, it } from "vitest";
import { projectPartsPlugin } from "../../../src/lib/markdown/project-parts.ts";

const story = `{/* A comment before the first part. */}

## Problem

Who had the problem.

### A sub-heading

More about it.

## Options

Routes considered.

- **Simple:** Easy to run.
- **Fast:** Quick.

| Option | Simple | Fast |
| --- | --- | --- |
| **A script** | yes | no |
| A service | no | yes |

Why a script: it is simplest.

## Build

What was built.

| Step | Time |
| --- | --- |
| One | Short |

## Lessons

What was learned.
`;

const project = new URL("file:///site/src/content/projects/sample.mdx");

function compile(source: string, fileURL?: URL): string {
  return mdxToJs(source, { mdastPlugins: [projectPartsPlugin], ...(fileURL ? { fileURL } : {}) } as never).code;
}

describe("projectPartsPlugin", () => {
  it("is named, so the config can be checked for it", () => {
    expect(typeof projectPartsPlugin).toBe("function");
  });

  it("wraps the four parts in ProjectPart elements in order, each named for its part", () => {
    const code = compile(story, project);
    const names = [...code.matchAll(/_jsxs?\(ProjectPart,\s*\{\s*name:\s*"([a-z]+)"/g)].map((m) => m[1]);
    expect(names).toEqual(["problem", "options", "build", "lessons"]);
  });

  it("keeps each heading and the text after it inside its part", () => {
    const code = compile(story, project);
    const part = (name: string) => {
      const start = code.indexOf(`name: "${name}"`);
      const next = code.indexOf("_jsxs(ProjectPart", start);
      return code.slice(start, next === -1 ? undefined : next);
    };
    expect(part("problem")).toContain("Who had the problem.");
    expect(part("problem")).toContain("A sub-heading");
    expect(part("problem")).not.toContain("Routes considered.");
    expect(part("options")).toContain("Routes considered.");
    expect(part("build")).toContain("What was built.");
    expect(part("lessons")).toContain("What was learned.");
  });

  it("replaces the table in the Options part with one OptionsTable element and renders no table of its own there", () => {
    const code = compile(story, project);
    expect(code.match(/_jsx\(OptionsTable,\s*\{\s*\}\)/g)).toHaveLength(1);
    // The writer's Options cells are gone: the component draws them from the checked comparison.
    expect(code).not.toContain("A service");
    expect(code).not.toContain("A script");
  });

  it("leaves a table in any other part as a plain table", () => {
    const code = compile(story, project);
    expect(code.match(/_components\.table/g)).toHaveLength(1);
    expect(code).toContain("Short");
  });

  it("keeps the constraint list and the Why line in the Options part as written", () => {
    const code = compile(story, project);
    expect(code).toContain("Easy to run.");
    expect(code).toContain("Why a script: it is simplest.");
  });

  it("leaves text before the first heading outside every part", () => {
    const code = compile("Intro text.\n\n" + story.replace(/^\{\/\*[^]*?\*\/\}\n\n/, ""), project);
    expect(code.indexOf("Intro text.")).toBeLessThan(code.indexOf("_jsxs(ProjectPart"));
  });

  it("does nothing for a file outside src/content/projects/", () => {
    for (const fileURL of [
      new URL("file:///site/src/content/posts/sample.mdx"),
      new URL("file:///site/src/content/pages/sample.mdx"),
      undefined,
    ]) {
      const code = compile(story, fileURL);
      expect(code).not.toContain("ProjectPart");
      expect(code).not.toContain("OptionsTable");
      expect(code.match(/_components\.table/g)).toHaveLength(2);
    }
  });
});
