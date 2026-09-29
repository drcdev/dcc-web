// Read-only local-credentials provider: reads `.env` with Node's built-in
// process.loadEnvFile (Principle IV — no `dotenv` dependency). Never logs,
// returns or includes a value in an error message (FR-005, FR-024, FR-030):
// `get`/`has` only ever return the value itself or presence, and any parse
// failure is reported by variable name only.
import { fileURLToPath } from "node:url";
import type { EnvReader } from "../types.ts";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export function createEnvReader(source?: Record<string, string | undefined>): EnvReader {
  let values: Record<string, string | undefined>;

  if (source) {
    values = source;
  } else {
    try {
      process.loadEnvFile(`${REPO_ROOT}.env`);
    } catch {
      // No .env file yet, or it could not be parsed — local-credentials
      // reports this as missing; there is nothing to read.
    }
    values = process.env;
  }

  return {
    get(name: string): string | undefined {
      const value = values[name];
      return value && value.length > 0 ? value : undefined;
    },
    has(name: string): boolean {
      const value = values[name];
      return typeof value === "string" && value.length > 0;
    },
  };
}
