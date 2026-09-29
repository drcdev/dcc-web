# Contract: Site origin resolution

Module: `src/lib/site-origin.ts` (pure; unit-tested in `tests/unit/site/site-origin.test.ts`).
Consumers: `astro.config.mjs` (`site`), `scripts/deploy/preview.ts`.

```ts
export const FALLBACK_ORIGIN = "https://doncoleman.ca";
export function previewAlias(branch: string): string | null;
export function resolveSiteOrigin(
  env: { WORKERS_CI?: string; WORKERS_CI_BRANCH?: string },
  config: { reviewHost: string; workerName: string; workersSubdomain?: string },
): string; // origin, no trailing slash
```

## Resolution

| `WORKERS_CI` | `WORKERS_CI_BRANCH` | `workersSubdomain` | Result |
|---|---|---|---|
| `1` | `main` | any | `https://{reviewHost}` → `https://new.doncoleman.ca` |
| `1` | other, valid alias | set | `https://{alias}-{workerName}.{workersSubdomain}.workers.dev` |
| `1` | other, alias `null` | any | `https://doncoleman.ca` |
| `1` | other | missing | `https://doncoleman.ca` |
| unset / not `1` | any | any | `https://doncoleman.ca` |
| any | any | invalid config (bad host) | `https://doncoleman.ca` |

## `previewAlias`

1. Lowercase. 2. Replace each run of chars outside `[a-z0-9]` with `-`. 3. Trim `-` at both ends.
4. If first char is not `a–z`, prefix `br-`. 5. Truncate to 55 chars (63 − `-dcc-web`), trim
trailing `-`. 6. Empty → `null`.

Examples: `002-site-foundation` → `br-002-site-foundation`; `Feature/Nav_Fix` → `feature-nav-fix`;
`---` → `null`.

## `pnpm run deploy:preview`

Runs `wrangler versions upload --preview-alias {previewAlias(WORKERS_CI_BRANCH)}`; exits non-zero
with a plain message if `WORKERS_CI_BRANCH` is missing or yields `null`. Never used for `main`.
