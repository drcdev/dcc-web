# Data model: Collapsible questions panel on small screens

No stored data. The feature adds one piece of page-lifetime UI state.

## Disclosure state

| Field | Where it lives | Values | Initial |
|---|---|---|---|
| expanded | `aria-expanded` on the `[data-questions-toggle]` button | `"false"`, `"true"` | `"false"` in the prerendered HTML |

- **Single source**: nothing else records the state. CSS reads it to show the content below
  xl and to turn the chevron; the script reads and flips it on click.
- **Transitions**: closed → open and open → closed, only on the reader activating the button
  (pointer, Enter or Space). Nothing else changes it: not a resize, not a request, not a status
  change.
- **Width**: the attribute has effect only below 1280 px. At 1280 px and wider the content is
  shown and the button is not displayed, whatever the value; crossing back below 1280 px shows
  the value last set (FR-007).
- **Lifetime**: the page. Never written to cookies, local or session storage, or the URL
  (FR-011).

## Relationship to the panel request state (feature 022, unchanged)

The request state (idle, loading, ready, ready again, limited, stale, error) and its data
(fetched questions, current status text, `busy` flag) are independent of the disclosure state.
Every combination is valid; for example "closed + loading" ends as "closed + ready", and the
questions are shown on the next open without a new request (FR-005).
