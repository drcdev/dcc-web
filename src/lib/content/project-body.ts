// Checks on the MDX body of a project file that the collection schema cannot make
// (contracts/build-errors.md rows 9 to 11, 16, 23 to 25, 28 to 30; FR-073). Same
// pattern as validatePageBody in body.ts. Each failure names the file. Code fences
// and inline code are ignored, so a story can show example tags and headings.
import { storyBlockNames } from "../../components/project/blocks/index.ts";
import { sectionNames } from "../../components/sections/index.ts";
import { projectFileError } from "./errors.ts";
import { stageIds, type StageId } from "./stages.ts";

export interface ProjectBodyContext {
  /** Keys of the project's `visuals` setting. */
  visualNames: readonly string[];
  /** `demo.embed` is true. */
  demoEmbed: boolean;
  /** `demo`, `standIn` or `source` is set, so the built chapter needs `<Demo />`. */
  hasDemoLinks: boolean;
}

/** Replaces fenced code blocks and inline code with blank space so they are not checked. */
function withoutCode(body: string): string {
  let fence: string | undefined;
  return body
    .split("\n")
    .map((line) => {
      const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
      if (fence) {
        if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
        return "";
      }
      if (marker) {
        fence = marker;
        return "";
      }
      return line.replace(/(`+)[^`]*?\1/g, "");
    })
    .join("\n");
}

const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tag)?.slice(1).find((v) => v !== undefined);

export function validateProjectBody(file: string, body: string, context: ProjectBodyContext): void {
  const fail = (problem: string) => projectFileError(file, problem);
  const text = withoutCode(body);

  if (/^ {0,3}#{1,2}(?:\s|$)/m.test(text) || /<h[12][\s>/]/i.test(text)) {
    throw fail("the body has a level-1 or level-2 heading. Chapter headings are set for you, so use ### for headings.");
  }
  if (/!\[\s*\]\(/.test(text)) {
    throw fail("an image in the body has no alt text. Describe the image inside the square brackets.");
  }

  const known = new Set<string>([...storyBlockNames, ...sectionNames]);
  const visuals = new Set(context.visualNames);
  const seen: StageId[] = [];
  const counts = { OptionComparison: 0, Invitation: 0, Demo: 0 };
  let current: StageId | undefined;

  const checkVisual = (name: string, where: string) => {
    if (name === "demo") {
      if (!context.demoEmbed) {
        throw fail(`${where} uses the visual "demo", but the demo is not set to embed. Set demo.embed to true in the settings.`);
      }
    } else if (!visuals.has(name)) {
      throw fail(
        `${where} uses the visual "${name}", which is not in visuals (${context.visualNames.join(", ") || "none defined"}).`,
      );
    }
  };

  for (const match of text.matchAll(/<(\/?)([A-Z][A-Za-z0-9]*)([^>]*)>/g)) {
    const [raw, closing, tag, rest] = match as unknown as [string, string, string, string];
    if (!known.has(tag)) {
      throw fail(`<${tag}> is not a building block. The blocks are: ${[...storyBlockNames, ...sectionNames].join(", ")}.`);
    }
    if (tag === "Chapter") {
      if (closing) {
        current = undefined;
        continue;
      }
      const stage = attr(raw, "stage") as StageId | undefined;
      if (!stage || !stageIds.includes(stage)) {
        throw fail(`a <Chapter> needs a stage, one of: ${stageIds.join(", ")}.`);
      }
      if (seen.includes(stage)) throw fail(`the chapter "${stage}" appears more than once.`);
      if (seen.length > 0 && stageIds.indexOf(stage) < stageIds.indexOf(seen[seen.length - 1]!)) {
        throw fail(`the chapter "${stage}" is out of order. The chapters run: ${stageIds.join(", ")}.`);
      }
      seen.push(stage);
      current = stage;
      const visual = attr(rest, "visual");
      if (visual !== undefined) checkVisual(visual, `<Chapter stage="${stage}">`);
      continue;
    }
    if (closing) continue;
    if (tag === "Visual") {
      const name = attr(rest, "name");
      if (name) checkVisual(name, "<Visual>");
    } else if (tag in counts) {
      const block = tag as keyof typeof counts;
      const home: StageId = block === "OptionComparison" ? "options" : block === "Invitation" ? "invitation" : "built";
      if (current !== home) throw fail(`<${block} /> must be used inside the ${home} chapter.`);
      if (++counts[block] > 1) throw fail(`<${block} /> can be used only once.`);
    }
  }

  for (const stage of stageIds) {
    if (!seen.includes(stage)) throw fail(`the story is missing the chapter "${stage}".`);
  }
  if (counts.OptionComparison === 0) throw fail("the options chapter needs <OptionComparison />.");
  if (counts.Invitation === 0) throw fail("the invitation chapter needs <Invitation />.");
  if (context.hasDemoLinks && counts.Demo === 0) {
    throw fail("a demo, stand-in or source address is set, so the built chapter needs <Demo />.");
  }
}
