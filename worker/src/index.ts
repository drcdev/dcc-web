import { handleSubmit } from "./contact/submit";
import { json } from "./http";
import { handleMessages } from "./messages/router";

export default {
  // Only /api/* reaches the Worker (`assets.run_worker_first`). Later phases add routes.
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return handleSubmit(request, env);
    if (pathname === "/api/messages" || pathname.startsWith("/api/messages/")) {
      return handleMessages(request, env, pathname);
    }
    return json({ error: "not_found" }, 404);
  },

  // The retention cron is implemented in a later phase.
  async scheduled(): Promise<void> {},
} satisfies ExportedHandler<Env>;
