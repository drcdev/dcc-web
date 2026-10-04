// Writes the Worker config that `wrangler dev` uses under Playwright: wrangler.jsonc without the
// `ai` binding. Wrangler runs an `ai` binding through a remote proxy session, which needs a
// Cloudflare login, and a CI or Docker run has none (specs/022 research R12 fallback). The panel
// journeys stub /api/questions with page.route, so no E2E test reaches the binding. The file sits
// at the repository root, because wrangler resolves `main`, `assets` and `migrations_dir` from the
// config's own directory, and is gitignored.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripJsonc } from "./setup-check/checks/contact-shared.ts";

const root = new URL("../", import.meta.url);
const config = JSON.parse(
  stripJsonc(readFileSync(fileURLToPath(new URL("wrangler.jsonc", root)), "utf8")),
) as Record<string, unknown>;
delete config.ai;
delete config.$schema;
writeFileSync(fileURLToPath(new URL("wrangler.e2e.json", root)), `${JSON.stringify(config, null, 2)}\n`);
