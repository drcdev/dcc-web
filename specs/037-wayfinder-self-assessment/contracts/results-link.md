# Contract: results link

**Feature**: `037-wayfinder-self-assessment` | Research: [../research.md](../research.md) R4, R5

Pure functions in `src/lib/assessment/result-link.ts` (no DOM, no Node APIs), unit-tested.

## Grammar

```text
fragment = "result=" version "." date "." sum "-" sum "-" sum "-" sum "-" sum
version  = 8 lowercase hex digits
date     = YYYYMMDD           ; a real calendar date
sum      = integer 3..15      ; no leading zeros, no sign
```

Example URL: `https://www.doncoleman.ca/writing/<post slug>/#result=3fa9c2d0.20261011.7-12-15-9-3`

The sums are in the data file's shift order. A score is `sum / 3`.

## Functions

| Function | Contract |
|----------|----------|
| `encodeResult(result)` | Returns the fragment without `#`. Throws on a sum outside 3–15, a count other than five, or a bad version. |
| `decodeResult(hash)` | Takes `location.hash` (with or without `#`). Returns `{ kind: "none" }` when the fragment does not start with `result=` (an ordinary heading anchor, or empty); `{ kind: "result", result }` when it matches the grammar; `{ kind: "malformed" }` otherwise (wrong count, out-of-range sum, impossible date such as `20260230`, extra characters). |
| `resultUrl(location, result)` | `origin + pathname + "#" + encodeResult(result)`; drops any query string. |

## Page behaviour

| Row | When | Then |
|-----|------|------|
| L1 | Load with `{ kind: "result" }`, same version as the page | Earlier result shown at once, marked "Earlier result from <date>", empty form below; the reserved title-card link (assessment-ui.md) changes its text to "Your earlier result is below" and its target to the earlier result's heading. Nothing is inserted into the title card, so nothing moves (U21). Page stays at the top. |
| L2 | Load with `{ kind: "result" }`, different version | As L1, plus the mark "made with an earlier set of questions"; a later retake is shown separately with no change per shift (FR-014). |
| L3 | Load with `{ kind: "malformed" }` | No earlier result; the assessment's status line (polite live region, visible above the form) says "This results link could not be read." The title-card link keeps "Take the self-assessment". Nothing else changes; the fragment is left as it is until results are shown or cleared. |
| L4 | Load with `{ kind: "none" }` | Nothing happens; the module loads lazily (research R3). |
| L5 | Results shown (first take or retake) | `history.replaceState(history.state, "", "#" + encodeResult(newest))`; no history entry added (`history.length` unchanged). |
| L6 | Clear | `history.replaceState(history.state, "", pathname + search)`. |
| L7 | Any time | No request carries the fragment or any answer: the fragment is never sent by the browser (not in the URL, not in `Referer`), and the module makes no `fetch`, XHR, beacon, image, prefetch, WebSocket or navigation request (SC-004, U15). The production-only analytics beacon is covered by spec FR-016b. |

A date in the future is accepted (a reader's clock and time zone are not the site's concern);
the date is displayed, never used for arithmetic.
