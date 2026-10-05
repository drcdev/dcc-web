// The question source of one post: `/writing/{slug}/question-source.json` (specs/022 research R2,
// data-model section 1). The questions API reads it through the Worker's ASSETS binding, so it
// generates only for a post the build published. getStaticPaths() uses getPosts(), as the post
// page does, so drafts exist only in builds that publish them
// (docs.astro.build/en/guides/endpoints/#static-file-endpoints).
import type { APIRoute } from "astro";
import { prepareQuestionSource } from "../../../lib/questions/source";
import { getPosts } from "../../../lib/posts";

export async function getStaticPaths() {
  const entries = await getPosts();
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getPosts>>[number] };
  const source = prepareQuestionSource({
    slug: entry.id,
    title: entry.data.title,
    summary: entry.data.summary,
    body: entry.body ?? "",
  });
  return new Response(JSON.stringify(source), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
