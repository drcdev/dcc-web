// Runs one Astro build() or sync() for the fixture-site harness in its own Node
// process (Vitest's module graph does not expose the "astro" package's Node API).
// Usage: node tests/build/run-astro.ts <site root> <build|sync>
// On failure prints the error as one JSON line on stdout and exits with 1.
import { resolve } from "node:path";
import { build, sync } from "astro";

const [root, mode] = process.argv.slice(2);
try {
  // Each fixture site keeps its own cache (content data store, image cache).
  // The default, node_modules/.astro, is shared through the node_modules symlink,
  // so parallel builds would read one another's page files.
  const inlineConfig = { root, logLevel: "silent" as const, cacheDir: resolve(root!, ".astro-cache") };
  if (mode === "sync") await sync(inlineConfig);
  else await build(inlineConfig);
} catch (error) {
  const extra = error as Error & { hint?: string; loc?: { file?: string } };
  const text = [extra.message, extra.hint, extra.loc?.file].filter(Boolean).join("\n");
  console.log(JSON.stringify({ error: text }));
  process.exit(1);
}
