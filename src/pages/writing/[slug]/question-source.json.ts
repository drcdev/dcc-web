// The question source of one post: `/writing/{slug}/question-source.json` (specs/022 research R2,
// data-model section 1). The questions API reads it through the Worker's ASSETS binding, so it
// generates only for a post the build published. getStaticPaths() uses getPosts(), as the post
// page does, so drafts exist only in builds that publish them
// (docs.astro.build/en/guides/endpoints/#static-file-endpoints).
import type { APIRoute } from "astro";
import { assessmentsNamedIn } from "../../../lib/assessment/checks";
import { loadAssessments } from "../../../lib/assessment/lookup";
import { expandForQuestions } from "../../../lib/assessment/question-text";
import { prepareQuestionSource } from "../../../lib/questions/source";
import { getPosts, postFileOf } from "../../../lib/posts";

export async function getStaticPaths() {
  const entries = await getPosts();
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getPosts>>[number] };
  // The assessment components stand for text in the data file; the questions read that text (FR-021).
  const body = entry.body ?? "";
  const usesAssessment = assessmentsNamedIn(body).used.length > 0;
  const source = prepareQuestionSource({
    slug: entry.id,
    title: entry.data.title,
    summary: entry.data.summary,
    body: usesAssessment ? expandForQuestions(body, await loadAssessments(), postFileOf(entry)) : body,
  });
  return new Response(JSON.stringify(source), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
