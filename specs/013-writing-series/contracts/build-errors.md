# Contract: Post build errors added or changed by this feature

Extends `specs/008-blog/contracts/build-errors.md`. Where each row is asserted (unit, sync or build) is listed in `docs/testing.md`, "Contract-row
mapping". The message must contain every item in the last column.

## New rows

| Row | Broken input | Caught by | Message contains |
|---|---|---|---|
| P23 | `topics: [drift, convergence]` | schema `superRefine` | file name, `drift`, `convergence`, "one series" |
| P24 | Free-form id within two letters of a controlled id (`convergance`, `drfit`, `agentic-a`) | schema `superRefine` | file name, the id written, the controlled id it probably meant |
| P25 | Post file `drift.mdx` or `convergence.mdx` | post file check (`assertPostFiles`) | file name, the address `/writing/drift/` (or convergence), "reserved" |
| P26 | Free-form id that breaks the id rules (`Cloud Cost`, 41+ characters) | schema | file name, "lower-case letters, digits and hyphens" or "40 characters" |

## Changed rows

| Row | Before | After |
|---|---|---|
| P6 | `agentic-a1` rejected as not in the enum, message lists every topic id | Still rejected (near-miss of `agentic-ai`); message names `agentic-a1`, says "Did you mean "agentic-ai"?" and still lists every controlled id in list order. |
| P21 | A topic removed from the list while a post names it fails the build | **Builds.** The id is now a free-form topic: neutral pill, page at `/writing/topics/{id}/`. Reason: FR-011 makes ids outside the controlled list valid. The near-miss rule (P24) still fails it if it is within two letters of a remaining controlled id. |

## Must build (valid fixtures)

| Case | Expectation |
|---|---|
| Post with no series tag | builds, no warning, no marker |
| Post whose only topic is free-form (`cloud-cost`) | builds; pill "Cloud cost" links to `/writing/topics/cloud-cost/`, which exists |
| Post with one series and other topics | builds; marker first |
