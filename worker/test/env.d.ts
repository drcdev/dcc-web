import type { D1Migration } from "@cloudflare/vitest-plugin";

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
      /** Which wrangler environment this Vitest project loads (worker/vitest.config.ts). */
      EXPECTED_ENVIRONMENT: "production" | "preview";
      /** database_name of the DB binding in the resolved wrangler config for this project. */
      EXPECTED_DATABASE_NAME: string;
      /** database_name of the other environment's DB binding. */
      OTHER_DATABASE_NAME: string;
      /** The other environment's read token (test value). */
      OTHER_READ_TOKEN: string;
    }
  }
}

export {};
