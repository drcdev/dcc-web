import { json } from "./http";

export default {
  // Only /api/* reaches the Worker (`assets.run_worker_first`). Later phases add routes;
  // until then every path is an unknown one.
  async fetch(): Promise<Response> {
    return json({ error: "not_found" }, 404);
  },

  // The retention cron is implemented in a later phase.
  async scheduled(): Promise<void> {},
} satisfies ExportedHandler<Env>;
