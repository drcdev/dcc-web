import { handleSubmit } from "./contact/submit";
import { json } from "./http";
import { handleQuestions } from "./questions/handler";

export default {
  // Only /api/* reaches the Worker (`assets.run_worker_first`). No scheduled handler: the site
  // keeps no contact data, so there is nothing to expire.
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return handleSubmit(request, env);
    if (pathname === "/api/questions") return handleQuestions(request, env);
    return json({ error: "not_found" }, 404);
  },
} satisfies ExportedHandler<Env>;
