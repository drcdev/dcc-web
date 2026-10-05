// Checks on the MDX body of a project file that the collection schema cannot make (contracts/build-errors.md
// rows P01-P07, T01-T13, R05, R06; FR-002, FR-006, FR-013 to FR-015). The body is parsed with `mdxToMdast`
// from satteri, the Markdown processor Astro uses here (research R1), so the rules read the real tree: a
// fully bold cell is told from a partly bold one, and code, escaped pipes and comments cannot fool it.
// Every failure names the file. Returns the checked Options table for the page to render.
import { mdxToMdast } from "satteri";
import { contentError } from "./errors.ts";
import type { Fit, OptionsComparison } from "./options-comparison.ts";
import { partHeadings, partIds, type PartId } from "./parts.ts";

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
