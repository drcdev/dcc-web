import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Applies the repository's migrations to the local D1 database before each test file.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
