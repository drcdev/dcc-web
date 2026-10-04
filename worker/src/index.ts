import { handleSubmit } from "./contact/submit";
import { json } from "./http";
import { handleMessages } from "./messages/router";
import { handleQuestions } from "./questions/handler";
import { runRetention } from "./retention";

export default {
  // Only /api/* reaches the Worker (`assets.run_worker_first`). Later phases add routes.
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return handleSubmit(request, env);
    if (pathname === "/api/questions") return handleQuestions(request, env);
    if (pathname === "/api/messages" || pathname.startsWith("/api/messages/")) {
      return handleMessages(request, env, pathname);
    }
    return json({ error: "not_found" }, 404);
  },

  // Daily retention (cron `17 3 * * *`, both environments): see retention.ts.
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    await runRetention(env.DB, controller.scheduledTime);
  },
} satisfies ExportedHandler<Env>;
