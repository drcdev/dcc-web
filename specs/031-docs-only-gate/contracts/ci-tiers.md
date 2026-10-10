# Contract: CI change tiers

The interface between `.github/workflows/ci.yml`, `scripts/ci/changed-paths.ts` and
`scripts/ci/verify-needs.ts`. The values are in `../data-model.md`; this file fixes the names.

## `changes` job

- Environment passed to `node scripts/ci/changed-paths.ts`:
  - `GITHUB_EVENT_NAME` (runner default);
  - `BEFORE_SHA: ${{ github.event.before }}` (empty on `pull_request`). Passed through `env:`,
    never interpolated into `run:`.
- Checkout: `fetch-depth: 2` (unchanged). The script fetches `BEFORE_SHA` itself on a push.
- Job outputs: exactly one, `tier: ${{ steps.changes.outputs.tier }}`. `full` and
  `content_only` are removed.
- The script never exits non-zero over a detection problem; an unexpected exception leaves
  `tier` unset, every job runs, and `verify` fails on the unset tier.
- Log line: `tier=<value>: <reason>` followed by `Changed files:` and one path per line.

## Workflow conditions (exact strings, asserted by `tests/unit/ci/workflows.test.ts`)

| Location | `if:` |
|---|---|
| `static` Lint, Type-check, worker tests | `needs.changes.outputs.tier != 'skip-safe' && needs.changes.outputs.tier != 'docs'` |
| `static` unit and component tests | `needs.changes.outputs.tier != 'skip-safe'` |
| `static` secretlint | none |
| `build-tests` job, `e2e` job | `needs.changes.outputs.tier != 'skip-safe' && needs.changes.outputs.tier != 'docs'` |
| `build-tests` `test:build` | `needs.changes.outputs.tier != 'content-only'` |
| `build-tests` `test:build:content` | `needs.changes.outputs.tier == 'content-only'` |
| `verify` job | `always()` |

Every condition is a negation of a narrow tier, except the `test:build:content` step, so an
unset tier runs the heavier path.

## Concurrency

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event_name == 'pull_request' && github.ref || github.sha }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

## `verify` job

Unchanged shape: `needs: [changes, static, build-tests, e2e]`, `if: always()`,
`NEEDS: ${{ toJSON(needs) }}`, `node scripts/ci/verify-needs.ts`. Exit 0 only under the rules in
`../data-model.md` "Needs decision".
