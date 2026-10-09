// checks/launch-content-ready.ts (setup item 25, contracts/setup-items.md; FR-003, FR-003a): the
// content is ready to go live. Repository files only, read through RepoReader. Four rules: every
// expected page exists and is published or deliberately hidden (visible: false); no published page
// says "placeholder copy"; no published project still marks its visual as a placeholder; the
// privacy policy states Cloudflare D1 storage and names none of the retired services.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, missing } from "./shared.ts";

const ITEM = { id: "launch-content-ready", order: 25 };
const NEXT_ACTION = "Replace the placeholder copy and publish the page (draft: false), then run this check again.";
const PAGES_DIR = "src/content/pages";
const PROJECTS_DIR = "src/content/projects";
const RETIRED_SERVICES = ["Ghost", "Supabase", "Mailgun", "Fly.io"];

function frontmatter(text: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match ? match[1]! : "";
}

function isDraft(text: string): boolean {
  return /^draft:\s*true\s*$/m.test(frontmatter(text));
}

function isHidden(text: string): boolean {
  return /^visible:\s*false\s*$/m.test(frontmatter(text));
}

function mdxIds(files: string[]): string[] {
  return files.filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -".mdx".length));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const expected = config?.launch?.expectedPages;
  if (!expected) {
    return missing(
      ITEM,
      "setup/config.json has no launch.expectedPages list.",
      "Add launch.expectedPages (the page ids that must be live) to setup/config.json, then run this check again.",
    );
  }

  const problems: string[] = [];

  for (const id of expected) {
    const path = `${PAGES_DIR}/${id}.mdx`;
    const text = ctx.fs.readText(path);
    if (text === null) {
      problems.push(`${id}: page file ${path} is missing`);
    } else if (!isHidden(text) && isDraft(text)) {
      problems.push(`${id}: page is still a draft`);
    }
  }

  for (const id of mdxIds(ctx.fs.listFiles(PAGES_DIR))) {
    const text = ctx.fs.readText(`${PAGES_DIR}/${id}.mdx`);
    if (text === null || isDraft(text) || isHidden(text)) continue;
    if (/placeholder copy/i.test(text)) problems.push(`${id}: still says "placeholder copy"`);
  }

  for (const id of mdxIds(ctx.fs.listFiles(PROJECTS_DIR))) {
    const text = ctx.fs.readText(`${PROJECTS_DIR}/${id}.mdx`);
    if (text === null || isDraft(text)) continue;
    if (/^\s*placeholder:\s*true\s*$/m.test(frontmatter(text))) {
      problems.push(`${id}: project visual marked placeholder`);
    }
  }

  const privacy = ctx.fs.readText(`${PAGES_DIR}/privacy-policy.mdx`);
  if (privacy !== null) {
    if (!/Cloudflare D1/i.test(privacy)) {
      problems.push("privacy-policy: does not state that messages are stored in Cloudflare D1");
    }
    const retired = RETIRED_SERVICES.find((name) => new RegExp(`\\b${escapeRegExp(name)}(?![\\w])`, "i").test(privacy));
    if (retired) problems.push(`privacy-policy: names a retired service (${retired})`);
  }

  if (problems.length === 0) {
    return complete(ITEM, "Every expected page is published or deliberately hidden, with no placeholder copy and an up-to-date privacy policy.");
  }
  return missing(ITEM, `${problems.length} launch content problem(s).`, NEXT_ACTION, problems);
}
