// Reads the one Now entry for the home page (specs/040-home-now-start-here/contracts/build-errors.md
// N06, N07, N08). The collection schema sees only the front matter, so the body check runs here.
import { getCollection, render } from "astro:content";
import { checkNowBody, checkNowFiles, nowTopics } from "../content/collections/now-rules.ts";

export interface Now {
  /** `YYYY-MM-DD` */
  updated: string;
  topics: Record<(typeof nowTopics)[number]["key"], string>;
  /** The rendered "open to" paragraph. */
  OpenTo: Awaited<ReturnType<typeof render>>["Content"];
}

export async function getNow(): Promise<Now> {
  const entries = await getCollection("now");
  const entry = entries[0];
  checkNowFiles(entries.length);
  if (!entry) throw new Error("unreachable: checkNowFiles passed with no entry");
  checkNowBody(entry.filePath ?? "src/content/now/now.mdx", entry.body ?? "");
  const { Content } = await render(entry);
  const { updated, ...topics } = entry.data;
  return { updated, topics, OpenTo: Content };
}
