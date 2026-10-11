// Writes the Worker config that `wrangler dev` uses under Playwright: wrangler.jsonc without the
// `ai` binding or any `routes` (see lib/e2e-wrangler-config.ts for why). The panel journeys stub
// /api/questions with page.route, so no E2E test reaches the binding. The file sits at the
// repository root, because wrangler resolves `main`, `assets` and `migrations_dir` from the
// config's own directory, and is gitignored.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toE2eWranglerConfig } from "./lib/e2e-wrangler-config.ts";
import { stripJsonc } from "./lib/jsonc.ts";

const root = new URL("../", import.meta.url);
const config = JSON.parse(
  stripJsonc(readFileSync(fileURLToPath(new URL("wrangler.jsonc", root)), "utf8")),
) as Record<string, unknown>;
writeFileSync(
  fileURLToPath(new URL("wrangler.e2e.json", root)),
  `${JSON.stringify(toE2eWranglerConfig(config), null, 2)}\n`,
);
