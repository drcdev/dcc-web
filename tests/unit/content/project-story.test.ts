// Unit tests for validateProjectStory (contracts/build-errors.md rows P01-P07, T01-T13, R05, R06, the
// allowed cases, and the OptionsComparison it returns; FR-002, FR-006, FR-013-FR-015, US3).
import { describe, expect, it } from "vitest";
import { validateProjectStory } from "../../../src/lib/content/project-story.ts";

const FILE = "src/content/projects/example.mdx";

const LIST = "- **Simple:** easy to run\n- **Cheap:** costs little";
const TABLE = "| Option | Simple | Cheap |\n| --- | --- | --- |\n| **A script** | yes | partly |\n| A service | no | no |";
const WHY = "Why a script: it is the simplest thing that works.";

/** A valid Options part, with each piece replaceable. */
function options(parts: { list?: string; table?: string; after?: string } = {}): string {
  const { list = LIST, table = TABLE, after = WHY } = parts;
  return ["## Options", "", "Intro to the options.", "", list, "", table, "", after].join("\n");
}

/** A valid story, with the Options part replaceable. */
function story(optionsPart: string = options(), extra: { before?: string; build?: string } = {}): string {
  return [
    extra.before ?? "",
    "## Problem",
    "",
    "Who had the problem.",
    "",
    optionsPart,
    "",
    "## Build",
    "",
    extra.build ?? "What was built.",
    "",
    "## Lessons",
    "",
    "What was learned.",
  ].join("\n");
}

const run = (body: string) => () => validateProjectStory(FILE, body);
function rejects(body: string, ...contains: string[]) {
  const fn = run(body);
  expect(fn).toThrow(FILE);
  for (const text of contains) expect(fn).toThrow(text);
}

describe("returned OptionsComparison", () => {
  it("has the option header, constraints, options, chosen flag and lower-cased answers", () => {
    expect(validateProjectStory(FILE, story())).toEqual({
      optionHeader: "Option",
      constraints: [{ label: "Simple" }, { label: "Cheap" }],
      options: [
        { name: "A script", chosen: true, fits: ["yes", "partly"] },
        { name: "A service", chosen: false, fits: ["no", "no"] },
      ],
    });
  });
});

describe("parts (P01-P07)", () => {
  it("P01 a missing part", () => {
    rejects(story().replace("## Lessons", "### Lessons"), "missing the part", "Lessons");
  });

  it("P02 a renamed or extra level-2 heading", () => {
    rejects(story().replace("## Build", "## Construction"), "Construction", "Problem, Options, Build, Lessons");
    rejects(`${story()}\n\n## Epilogue\n\nMore.`, "Epilogue", "Problem, Options, Build, Lessons");
  });

  it("P03 a part repeated", () => {
    rejects(`${story()}\n\n## Lessons\n\nAgain.`, "Lessons", "more than once");
  });

  it("P04 parts out of order", () => {
    const body = story().replace("## Build", "## Temp").replace("## Lessons", "## Build").replace("## Temp", "## Lessons");
    rejects(body, "out of order", "Problem, Options, Build, Lessons");
  });

  it("P05 a level-1 heading in the body", () => {
    rejects(`# Title\n\n${story()}`, "level-1 heading", "##");
    rejects(story(options(), { build: "# Inside" }), "level-1 heading", "##");
  });

  it("P06 an image in the body", () => {
    rejects(story(options(), { build: "![A picture](./images/a.png)" }), "visuals", "part");
  });

  it("P07 text before the first part", () => {
    rejects(story(options(), { before: "Some introduction.\n\n" }), "before ## Problem");
  });

  it("allows sub-headings, MDX comments anywhere, and a table outside Options", () => {
    const build = "### A detail\n\n{/* a note */}\n\n| a | b |\n| - | - |\n| 1 | 2 |";
    const body = story(options({ after: `${WHY}\n\n{/* after */}` }), { before: "{/* top note */}\n\n", build });
    expect(run(body)).not.toThrow();
  });

  it("ignores tags and headings shown inside code", () => {
    const build = "```mdx\n# Title\n<Chapter />\nimport x from 'y'\n```\n\nInline `<Demo />`.";
    expect(run(story(options(), { build }))).not.toThrow();
  });
});

describe("plain Markdown only (R05, R06)", () => {
  it.each(["Chapter", "OptionComparison", "Demo", "Invitation", "Visual", "Callout"])("R05 rejects <%s />", (tag) => {
    rejects(story(options(), { build: `<${tag} />` }), `<${tag}>`, "plain Markdown");
  });

  it("R05 rejects an element wrapped around text, and one inside a paragraph", () => {
    rejects(story(options(), { build: '<Chapter stage="build">\n\nText\n\n</Chapter>' }), "<Chapter>", "plain Markdown");
    rejects(story(options(), { build: "Some <Demo /> text." }), "<Demo>", "plain Markdown");
  });

  it("R06 rejects import and export", () => {
    rejects(story(options(), { before: "import X from './x.astro'\n\n" }), "plain Markdown");
    rejects(story(options(), { build: "export const a = 1" }), "plain Markdown");
  });
});

describe("the Options part (T01-T13)", () => {
  it("T01 no table", () => {
    rejects(story(options({ table: "" })), "Options", "needs one table");
  });

  it("T02 more than one table", () => {
    rejects(story(options({ table: `${TABLE}\n\n${TABLE}` })), "Options", "only one table");
  });

  it("T03 the option column is not named", () => {
    rejects(story(options({ table: TABLE.replace("| Option |", "|  |") })), "first column", "names the options");
  });

  it("T04 no constraint columns", () => {
    rejects(story(options({ table: "| Option |\n| --- |\n| **A script** |\n| A service |" })), "at least one constraint column");
  });

  it("T05 a row with the wrong number of cells", () => {
    rejects(story(options({ table: TABLE.replace("| no | no |", "| no |") })), "A service", "cells");
  });

  it("T06 an answer that is not yes, partly or no", () => {
    rejects(story(options({ table: TABLE.replace("| partly |", "| maybe |") })), "A script", "Cheap", "yes, partly or no");
  });

  it("T07 no bold option, or more than one", () => {
    rejects(story(options({ table: TABLE.replace("**A script**", "A script") })), "exactly one option must be in bold", "0");
    rejects(story(options({ table: TABLE.replace("A service", "**A service**") })), "exactly one option must be in bold", "2");
  });

  it("T08 an option bolded only in part", () => {
    rejects(story(options({ table: TABLE.replace("A service", "A **service**") })), "A service", "exactly one option must be in bold");
  });

  it("T09 the first block after the table is not a Why paragraph", () => {
    rejects(story(options({ after: "Because it is simple." })), "Why");
    rejects(story(options({ after: "" })), "Why");
    rejects(story(options({ after: "- Why a list\n\nWhy later." })), "Why");
  });

  it("T10 no list before the table", () => {
    rejects(story(options({ list: "" })), "constraint list");
  });

  it("T11 a list item with no bold label or no colon", () => {
    rejects(story(options({ list: "- **Simple:** easy\n- Cheap: costs little" })), "Cheap: costs little", "bold label");
    rejects(story(options({ list: "- **Simple:** easy\n- **Cheap** costs little" })), "Cheap", "bold label");
  });

  it("T12 labels differ from the headings in name or order", () => {
    rejects(story(options({ list: "- **Cheap:** a\n- **Simple:** b" })), "Simple", "Cheap", "same names, in the same order");
    rejects(story(options({ list: "- **Simple:** a\n- **Fast:** b" })), "Fast", "same names, in the same order");
    rejects(story(options({ list: "- **Simple:** a" })), "same names, in the same order");
  });

  it("T13 a repeated option or constraint name", () => {
    rejects(story(options({ table: TABLE.replace("A service", "A script") })), "A script", "more than once");
    rejects(
      story(options({ list: "- **Simple:** a\n- **Simple:** b", table: TABLE.replace("Cheap", "Simple") })),
      "Simple",
      "more than once",
    );
  });

  it("allows Yes and PARTLY in any case, bold or a link in an answer cell", () => {
    const table = TABLE.replace("| yes |", "| Yes |")
      .replace("| partly |", "| PARTLY |")
      .replace("| no | no |", "| **no** | [no](https://example.com) |");
    const result = validateProjectStory(FILE, story(options({ table })));
    expect(result.options.map((o) => o.fits)).toEqual([
      ["yes", "partly"],
      ["no", "no"],
    ]);
  });

  it("allows a one-option table whose only row is bold", () => {
    const table = "| Option | Simple |\n| --- | --- |\n| **Only one** | yes |";
    const result = validateProjectStory(FILE, story(options({ list: "- **Simple:** easy", table })));
    expect(result.options).toEqual([{ name: "Only one", chosen: true, fits: ["yes"] }]);
  });

  it("allows a multi-sentence Why line", () => {
    expect(run(story(options({ after: "Why a script: it is simple. It is also cheap. Nothing else came close." })))).not.toThrow();
  });

  it("allows a missing or multi-line explanation, and the colon inside or outside the bold label", () => {
    const list = "- **Simple:**\n- **Cheap**: costs little,\n  and runs anywhere";
    expect(run(story(options({ list })))).not.toThrow();
  });

  it("allows an MDX comment between the table and the Why line", () => {
    expect(run(story(options({ after: `{/* note */}\n\n${WHY}` })))).not.toThrow();
  });

  it("allows a list in Problem, Build or Lessons", () => {
    expect(run(story(options(), { build: "- one\n- two" }))).not.toThrow();
  });
});
