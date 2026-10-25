// Reads the career collection for the About page's timeline (specs/041-career-timeline). This is
// the only reader of the collection (FR-019); CareerTimeline.astro is the only caller. The rules
// that span files run here, so a bad set fails the About page build naming the step file.
import { getCollection } from "astro:content";
import { getPostLookup } from "./posts.ts";
import { checkCareer, type StepFile } from "../content/collections/career-rules.ts";
import { buildTimeline, type Timeline } from "./content/career-view.ts";

export async function getCareerTimeline(): Promise<Timeline> {
  const entries = await getCollection("career");
  if (entries.length === 0) return { steps: [], categories: [] };
  const files: StepFile[] = entries.map((entry) => ({
    id: entry.id,
    file: entry.filePath ?? `src/content/career/${entry.id}.yaml`,
    data: { ...entry.data, posts: (entry.data.posts ?? []).map((post) => post.id) },
  }));
  const posts = await getPostLookup();
  checkCareer(files, posts);
  return buildTimeline(files, posts);
}
