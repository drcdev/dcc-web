// All of the `projects` collection's rules (specs/014-project-four-part-story/data-model.md "Project",
// "PartPicture"; contracts/build-errors.md rows S, R, N, P, T and RP). The schema is called with the
// `image` helper from the collection schema context (docs.astro.build/en/guides/images/#images-in-content-collections)
// and every object is strict, so an unknown, misspelled or removed setting fails the build naming it.
// Beside it: the status words, the checks on the MDX body that the schema cannot make
// (`validateProjectStory`) and the collection-level `replacedBy` checks (`checkReplacements`).
import { reference } from "astro:content";
import { z } from "astro/zod";
import { mdxToMdast } from "satteri";
import { contentError } from "../../lib/content/errors.ts";
import { partHeadings, partIds, type PartId } from "../../lib/content/parts.ts";
import { themeKey } from "../../lib/content/themes.ts";
import { requiredText as text, type ImageValidator } from "../../lib/content/schema-fields.ts";

// ---- Status ------------------------------------------------------------------------------------

export const projectStatuses = ["shipped", "experiment", "in-progress", "retired"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

// ---- Schema ------------------------------------------------------------------------------------
const httpsUrl = z.url({ protocol: /^https$/, error: "use an address that starts with https://" });

// FR-042: HTTPS on drc.dev or a subdomain, with no port and no user-info part.
const DRC_DEV = /^https:\/\/([a-z0-9-]+\.)*drc\.dev(\/[^\s]*)?$/;

const idPattern = /^[a-z][a-z0-9-]*$/;

const problem = text
  .max(140, "write the problem as one sentence of at most 140 characters")
  .regex(/[.?!]$/, "write the problem as one sentence of at most 140 characters that ends with . ? or !")
  .refine((value) => !/[.?!]\s+\S/.test(value), "write the problem as one sentence of at most 140 characters, not several sentences");

const part = z.enum(partIds, { error: `part must be one of ${partIds.join(", ")}` });

/** A picture of the kinds allowed on the list and in the story. */
function pictureVisuals(image: ImageValidator) {
  return [
    z.strictObject({
      kind: z.literal("image"),
      src: image(),
      alt: text,
    }),
    z.strictObject({
      kind: z.literal("diagram"),
      src: image(),
      alt: text,
      description: text,
    }),
  ] as const;
}

export function projectSchema({ image }: { image: ImageValidator }) {
  const [imageVisual, diagramVisual] = pictureVisuals(image);
  // A picture in the story also says which part it sits beside (optional: none means kept but not shown).
  const storyImage = imageVisual.extend({ part: part.optional() });
  const storyDiagram = diagramVisual.extend({ part: part.optional() });
  const visualName = z
    .string()
    .regex(idPattern, "use lower-case letters, digits and hyphens, starting with a letter");

  return z
    .strictObject({
      title: text,
      problem,
      description: text,
      themes: z.array(text).min(1, "list at least one theme").max(4, "list at most four themes"),
      status: z.enum(projectStatuses),
      // The project that replaced a retired one: a project on the site (linked to its page) or a name,
      // optionally with an https address. Missing and self references are checked in `checkReplacements` below.
      replacedBy: z.strictObject({ project: reference("projects").optional(), name: text.optional(), href: httpsUrl.optional() }).optional(),
      date: z.coerce.date(),
      visual: z.discriminatedUnion("kind", [imageVisual, diagramVisual]),
      visuals: z.record(visualName, z.discriminatedUnion("kind", [storyImage, storyDiagram])).optional(),
      demo: z
        .strictObject({
          href: z.string().regex(DRC_DEV, "use an https:// address on drc.dev, with no port or user name"),
          title: text.optional(),
        })
        .optional(),
      standIn: z.strictObject({ href: httpsUrl, label: text.optional() }).optional(),
      source: httpsUrl.optional(),
      image: z.strictObject({ src: image(), alt: text }).optional(),
      // Trimmed; empty text means the standard sentence (no value).
      invitation: z
        .string()
        .trim()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),
      draft: z.boolean().default(false),
    })
    .superRefine((value, ctx) => {
      if (value.demo && value.standIn) {
        ctx.addIssue({ code: "custom", path: ["standIn"], message: "use demo or standIn, not both" });
      }
      const replacedBy = value.replacedBy;
      if (replacedBy) {
        if (value.status !== "retired") {
          ctx.addIssue({
            code: "custom",
            path: ["replacedBy"],
            message: "only a retired project can name a replacement: set status: retired, or remove replacedBy",
          });
        }
        if (!replacedBy.project === !replacedBy.name) {
          ctx.addIssue({
            code: "custom",
            path: ["replacedBy"],
            message:
              "replacedBy needs either project (the file name of a project on the site) or name (with an optional href), not both",
          });
        } else if (replacedBy.project && replacedBy.href) {
          ctx.addIssue({
            code: "custom",
            path: ["replacedBy", "href"],
            message: "href goes with name: a project on the site is linked to its own page",
          });
        }
      }
      const seen = new Set<string>();
      value.themes.forEach((theme, index) => {
        const key = themeKey(theme);
        if (seen.has(key)) ctx.addIssue({ code: "custom", path: ["themes", index], message: `${theme} repeats a theme` });
        seen.add(key);
      });
      const byPart = new Map<string, string>();
      for (const [name, picture] of Object.entries(value.visuals ?? {})) {
        if (!picture.part) continue;
        const first = byPart.get(picture.part);
        if (first === undefined) {
          byPart.set(picture.part, name);
          continue;
        }
        ctx.addIssue({
          code: "custom",
          path: ["visuals", name, "part"],
          message: `the pictures ${first} and ${name} both use the part ${picture.part}; give each part at most one picture`,
        });
      }
    });
}

export type ProjectData = z.infer<ReturnType<typeof projectSchema>>;

// ---- The Options table -------------------------------------------------------------------------
// The checked Options table of a project story (data-model.md "OptionsComparison"). Produced by
// validateProjectStory from the Markdown table, never written as data, and passed to the page through
// `Astro.locals.project.comparison`.

export type Fit = "yes" | "partly" | "no";

export interface OptionsConstraint {
  /** Equals the bold label of the matching list item. */
  label: string;
}

export interface OptionsOption {
  /** Text of the first cell, bold markers removed. */
  name: string;
  /** The first cell is entirely one strong node. */
  chosen: boolean;
  /** One answer per constraint, lower-cased. */
  fits: Fit[];
}

export interface OptionsComparison {
  /** The table's first header cell text. */
  optionHeader: string;
  constraints: OptionsConstraint[];
  options: OptionsOption[];
}

// ---- The story body ----------------------------------------------------------------------------
// Checks on the MDX body of a project file that the collection schema cannot make (rows P01-P07,
// T01-T13, R05, R06; FR-002, FR-006, FR-013 to FR-015). The body is parsed with `mdxToMdast` from
// satteri, the Markdown processor Astro uses here (research R1), so the rules read the real tree: a
// fully bold cell is told from a partly bold one, and code, escaped pipes and comments cannot fool it.
// Every failure names the file. Returns the checked Options table for the page to render.

/** The parts of mdast this check reads; satteri's node type is wider than needed. */
interface Node {
  type: string;
  value?: string;
  name?: string | null;
  depth?: number;
  children?: Node[];
}

const ORDER = partIds.map((id) => partHeadings[id]).join(", ");
const FITS: readonly string[] = ["yes", "partly", "no"];

/** The plain text of a node, formatting removed. */
function textOf(node: Node): string {
  if (node.value !== undefined && !node.children) return node.value;
  return (node.children ?? []).map(textOf).join("");
}

const isComment = (node: Node): boolean =>
  (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") && /^\s*\/\*[\s\S]*\*\/\s*$/.test(node.value ?? "");

/** A comment on its own, or a paragraph holding only comments. */
function isCommentBlock(node: Node): boolean {
  if (isComment(node)) return true;
  if (node.type !== "paragraph") return false;
  const kids = node.children ?? [];
  return kids.length > 0 && kids.every((kid) => isComment(kid) || (kid.type === "text" && !(kid.value ?? "").trim()));
}

function walk(node: Node, visit: (node: Node) => void): void {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

export function validateProjectStory(file: string, body: string): OptionsComparison {
  const fail = (problem: string) => contentError("project", file, problem);

  let root: Node;
  try {
    root = mdxToMdast(body) as unknown as Node;
  } catch (error) {
    throw fail(`the body could not be read as plain Markdown (${error instanceof Error ? error.message.split("\n")[0] : "parse error"}).`);
  }

  // Plain Markdown only, and no images or level-1 headings anywhere in the body.
  walk(root, (node) => {
    if (node.type === "mdxjsEsm") {
      throw fail("the body has an import or export. A project story is plain Markdown, so remove it.");
    }
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      throw fail(`the body uses <${node.name ?? ""}>. A project story is plain Markdown, so use headings, lists, tables and links instead.`);
    }
    if ((node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") && !isComment(node)) {
      throw fail("the body has a {…} expression. A project story is plain Markdown; only {/* comments */} are allowed.");
    }
    if (node.type === "heading" && node.depth === 1) {
      throw fail(`the body has a level-1 heading ("${textOf(node)}"). The page title is set for you, so use ## for the four parts.`);
    }
    if (node.type === "image") {
      throw fail("the body has an image. Pictures go in the visuals setting, each with a part, not in the body.");
    }
  });

  // The four parts, in order. `groups` holds each part's top-level nodes.
  const groups = new Map<PartId, Node[]>();
  let current: Node[] | undefined;
  let last = -1;
  for (const node of root.children ?? []) {
    if (node.type === "heading" && node.depth === 2) {
      const text = textOf(node).trim();
      const id = partIds.find((part) => partHeadings[part] === text);
      if (!id) throw fail(`the heading "${text}" is not one of the four parts. Level-2 headings must be, in order: ${ORDER}.`);
      if (groups.has(id)) throw fail(`the part "${text}" appears more than once. The parts are: ${ORDER}.`);
      const index = partIds.indexOf(id);
      if (index < last) throw fail(`the part "${text}" is out of order. The parts run: ${ORDER}.`);
      last = index;
      current = [];
      groups.set(id, current);
    } else if (current) {
      current.push(node);
    } else if (!isCommentBlock(node)) {
      throw fail(`there is text before ## ${partHeadings.problem}. Everything must sit inside one of the four parts.`);
    }
  }
  for (const id of partIds) {
    if (!groups.has(id)) throw fail(`the story is missing the part "${partHeadings[id]}". Add a ## ${partHeadings[id]} heading. The parts are: ${ORDER}.`);
  }

  return checkOptions(groups.get("options")!, fail);
}

function checkOptions(nodes: Node[], fail: (problem: string) => Error): OptionsComparison {
  const tables = nodes.filter((node) => node.type === "table");
  if (tables.length === 0) throw fail("the Options part needs one table comparing the options.");
  if (tables.length > 1) throw fail("the Options part can hold only one table.");
  const table = tables[0]!;
  const tableIndex = nodes.indexOf(table);
  const [header, ...rows] = table.children ?? [];
  const headerCells = (header?.children ?? []).map((cell) => textOf(cell).trim());

  const optionHeader = headerCells[0] ?? "";
  if (!optionHeader) throw fail("the first column heading of the Options table is empty. The first column names the options, so give it a heading such as Option.");
  const labels = headerCells.slice(1);
  if (labels.length === 0) throw fail("the Options table needs at least one constraint column after the first.");
  const repeatedLabel = labels.find((label, i) => labels.indexOf(label) !== i);
  if (repeatedLabel !== undefined) throw fail(`the constraint heading "${repeatedLabel}" appears more than once in the Options table.`);

  const options = rows.map((row) => {
    const cells = row.children ?? [];
    const first = cells[0] ?? { type: "tableCell", children: [] };
    const name = textOf(first).trim();
    if (cells.length !== headerCells.length) {
      throw fail(`the option "${name}" has ${cells.length} cells but the table has ${headerCells.length} columns. Give every row one cell per column.`);
    }
    const kids = first.children ?? [];
    // Italic wrapping a single bold (`_**Name**_`) counts as fully bold, like `***Name***`.
    const onlyKid = kids.length === 1 ? kids[0]! : undefined;
    const italicBold = onlyKid?.type === "emphasis" && onlyKid.children?.length === 1 && onlyKid.children[0]!.type === "strong";
    const strong = kids.filter((kid) => kid.type === "strong" || (italicBold && kid === onlyKid));
    const chosen = strong.length === 1 && kids.length === 1;
    if (!chosen && strong.length > 0) {
      throw fail(`the option "${name}" is bold only in part, and exactly one option must be in bold. Bold the whole option name.`);
    }
    const fits = cells.slice(1).map((cell, i) => {
      const answer = textOf(cell).trim().toLowerCase();
      if (!FITS.includes(answer)) {
        throw fail(`the option "${name}" has "${textOf(cell).trim()}" under "${labels[i]}". Each answer must be yes, partly or no.`);
      }
      return answer as Fit;
    });
    return { name, chosen, fits };
  });
  const repeatedOption = options.map((o) => o.name).find((name, i, all) => all.indexOf(name) !== i);
  if (repeatedOption !== undefined) throw fail(`the option "${repeatedOption}" appears more than once in the Options table.`);
  const chosenCount = options.filter((o) => o.chosen).length;
  if (chosenCount !== 1) {
    throw fail(`exactly one option must be in bold in the Options table, found ${chosenCount}. Bold the option that was chosen.`);
  }

  // The first block after the table, skipping comments, is the "Why" line.
  const after = nodes.slice(tableIndex + 1).find((node) => !isCommentBlock(node));
  if (!after || after.type !== "paragraph" || !/^Why\b/.test(textOf(after).trim())) {
    throw fail('the first thing after the Options table must be a paragraph starting with "Why" that gives the reason for the choice.');
  }

  // The constraint list is the last list before the table.
  const list = nodes.slice(0, tableIndex).reverse().find((node) => node.type === "list");
  if (!list) throw fail("the Options part needs a constraint list before the table: one item per constraint, each starting with a bold label.");
  const listLabels = (list.children ?? []).map((item) => {
    const paragraph = (item.children ?? [])[0];
    const kids = paragraph?.type === "paragraph" ? (paragraph.children ?? []) : [];
    const strong = kids[0]?.type === "strong" ? kids[0] : undefined;
    const bold = strong ? textOf(strong).trim() : "";
    const colonInside = bold.endsWith(":");
    const colonAfter = strong !== undefined && textOf(kids[1] ?? { type: "text", value: "" }).startsWith(":");
    if (!strong || !(colonInside || colonAfter)) {
      throw fail(`the constraint list item "${textOf(item).trim()}" needs a bold label followed by a colon, such as **Simple to run:**.`);
    }
    return bold.replace(/:$/, "").trim();
  });
  if (listLabels.length !== labels.length || listLabels.some((label, i) => label !== labels[i])) {
    const quote = (names: string[]) => names.map((n) => `"${n}"`).join(", ");
    throw fail(
      `the constraint list (${quote(listLabels)}) and the table headings (${quote(labels)}) must have the same names, in the same order.`,
    );
  }
  const repeatedListLabel = listLabels.find((label, i) => listLabels.indexOf(label) !== i);
  if (repeatedListLabel !== undefined) throw fail(`the constraint "${repeatedListLabel}" appears more than once.`);

  return { optionHeader, constraints: labels.map((label) => ({ label })), options };
}

// ---- replacedBy --------------------------------------------------------------------------------
// Astro's reference() only reports a missing target when the entry is read, and then without
// naming the file, so RP04 and RP05 are checked here over every entry, drafts included.

// The schema allows exactly one of the two forms (RP02), so its inferred type has every key optional.
export type Replacement = { project?: { id: string }; name?: string; href?: string };

export interface Replaceable {
  id: string;
  data: { title: string; replacedBy?: Replacement };
}

const fileOf = (id: string) => `src/content/projects/${id}.mdx`;

/** RP04 (a missing project) and RP05 (a project replacing itself), each naming the file. */
export function checkReplacements(entries: readonly Replaceable[]): void {
  const ids = new Set(entries.map((entry) => entry.id));
  for (const entry of entries) {
    const replacedBy = entry.data.replacedBy;
    if (!replacedBy?.project) continue;
    const target = replacedBy.project.id;
    if (target === entry.id) {
      throw contentError(
        "project",
        fileOf(entry.id),
        "replacedBy names this project itself. Name the project that replaced it, or remove replacedBy.",
      );
    }
    if (!ids.has(target)) {
      throw contentError(
        "project",
        fileOf(entry.id),
        `replacedBy names the project "${target}", but there is no project file ${fileOf(target)}. Use the file name of a project on the site, or name: (with an optional href) for anything off the site.`,
      );
    }
  }
}
