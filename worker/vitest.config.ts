import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { unstable_readConfig } from "wrangler";
import { defineConfig } from "vitest/config";

const root = path.join(import.meta.dirname, "..");
const configPath = path.join(root, "wrangler.jsonc");

/** database_name of the `DB` binding in the wrangler config resolved for an environment. */
function databaseName(environment?: string) {
  const config = unstable_readConfig({ config: configPath, env: environment });
  const db = config.d1_databases.find((d: { binding: string }) => d.binding === "DB");
  if (!db?.database_name) throw new Error(`No DB binding in the ${environment ?? "production"} config`);
  return db.database_name;
}

// Test-only values; the real secrets are set per environment (Constitution VII).
const TOKENS = { production: "test-read-token", preview: "preview-test-read-token" } as const;

// Own config so Vitest does not walk up to the repository's Vitest 5 config.
export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(root, "migrations"));

  function project(name: "production" | "preview", include: string[]) {
    const other = name === "production" ? "preview" : "production";
    return {
      plugins: [
        cloudflareTest({
          // No Cloudflare account access in tests: the `ai` binding is never reached (tests inject fakes).
          remoteBindings: false,
          wrangler: {
            configPath: "../wrangler.jsonc",
            ...(name === "preview" ? { environment: "preview" } : {}),
          },
          miniflare: {
            bindings: {
              TEST_MIGRATIONS: migrations,
              TURNSTILE_SECRET_KEY: "test-turnstile-secret",
              EXPECTED_ENVIRONMENT: name,
              EXPECTED_DATABASE_NAME: databaseName(name === "preview" ? "preview" : undefined),
              OTHER_DATABASE_NAME: databaseName(other === "preview" ? "preview" : undefined),
              OTHER_READ_TOKEN: TOKENS[other],
            },
          },
        }),
      ],
      test: {
        name,
        include,
        setupFiles: ["./test/setup.ts"],
      },
    };
  }

  return {
    test: {
      // `production` runs every test against the top-level config; `preview` reruns only the
      // environment-isolation test against `env.preview` (SC-006, FR-017, FR-024).
      projects: [
        project("production", ["test/**/*.test.ts"]),
        project("preview", ["test/environments.test.ts"]),
      ],
    },
  };
});
