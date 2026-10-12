# Contract: assessment block (DOM and behaviour)

**Feature**: `037-wayfinder-self-assessment` | Research: [../research.md](../research.md) R3, R6–R10

`src/components/assessment/SelfAssessment.astro` renders the static parts; the lazily loaded
module `src/lib/assessment/client.ts` adds behaviour. Copy shown below in quotes is the plan's
default wording; tests assert structure and rules, not copy (docs/testing.md "Invariants, not
mirrors"). Rows are referenced as U1, U2, ... in tests.

## Static markup (build time)

Title card (posts that render `SelfAssessment` only, through `PostLayout`'s `title-extra` slot,
directly after the post summary):

```text
<p data-assessment-link-line class="... min-h-lh">   ; height reserved for one line at >= 320 px
  <a href="#<assessment heading id>-content" data-assessment-link>Take the self-assessment</a>
                                                     ; targets the content inside <details>, so the
                                                     ; browser opens it with JavaScript off (FR-001a)
</p>
```

```text
<section data-assessment="wayfinder" data-version="3fa9c2d0" data-assessment-data="{json}"
         aria-labelledby="<heading id from the Markdown ## above>" class="not-prose ...">
  <details data-assessment-details>                 ; collapsed by default (FR-001a); print: content shown
  <summary class="button styles">Take the self-assessment <svg data-disclosure-indicator></svg></summary>
                                                    ; print: hidden
  <div id="<heading id>-content" data-assessment-content class="bordered box">
  <div data-assessment-nojs>                       ; shown when root lacks .js, and in print without a result
    <p>The self-assessment needs JavaScript. The statements are listed below for reflection.</p>
    <h3>See the Whole System</h3> <ul><li>statement</li> x3</ul>   ; x5 shifts
  </div>
  <div data-assessment-app hidden-until-.js>       ; print: hidden
    <p>intro</p>
    <p role="status" aria-live="polite" data-assessment-status></p>
    <div data-assessment-earlier hidden></div>     ; earlier result (L1, L2)
    <form data-assessment-form novalidate>
      <div role="group" aria-labelledby="h3 id">   ; x5
        <h3>See the Whole System</h3>
        <fieldset data-statement="0.0"><legend>statement</legend>
          5 x <label><input type="radio" name="s-0-0" value="1..5"> Rarely … Almost always</label>
          <p data-statement-error hidden>Choose an answer.</p>
        </fieldset>                                 ; x3
      </div>
      <div data-assessment-errors hidden></div>     ; error summary (FR-006)
      <button type="button" data-assessment-show>Show my results</button>
      <button type="button" data-assessment-clear>Clear my answers</button>
    </form>
    <div data-assessment-results hidden></div>
  </div>
  </div>                                            ; data-assessment-content
  </details>
  <script> bootstrap (research R3): opens <details> for a #result= fragment or a fragment naming
           something inside it (on load and on hashchange); loads the module on approach or on open </script>
</section>
(print rules live in src/lib/assessment/client.css, linked by the module; research R7)
```

`data-assessment-data` carries only what the browser needs: shift names, from/to, anchors,
practical application text, scale labels, title (no week texts: the six-week plan was removed
on 2026-10-11). It is plain JSON
in an attribute (escaped by Astro); no inline script holds data.

## Behaviour rows

| Row | Requirement | Rule |
|-----|-------------|------|
| U1 | FR-001 | The block sits between the fifth shift section and "The Systems Leadership Wayfinder"; its heading is an `h2` in the page outline. |
| U2 | FR-002, FR-003 | 5 groups x 3 fieldsets x 5 labelled radios; every radio has a visible label; groups named by shift. |
| U3 | FR-006, FR-009 | "Show my results" with any unanswered statement: no results, an error summary stating the count ("3 statements need an answer.") and listing each unanswered statement (as links to its fieldset), `aria-invalid="true"` and a visible message tied by `aria-describedby` on each, the status region gets the count, focus on the first unanswered radio. Answering a statement clears its error. |
| U4 | FR-007 | Complete answers: chart (one row per shift, From and To wording at the ends, marker at `(score - 1) / 4` of the track) and text summary list, one line per shift: `<name>: <score> of 5, <band phrase>`. |
| U5 | FR-009 | Showing or updating results sets the status region text; the results container follows the buttons in DOM order. |
| U6 | FR-008 | Under "Mindsets to develop", each low-band shift, weakest first (ties in data order): "<name>: <score> of 5", "<from> → <to>", its Practical Application paragraph and a link "Read <name>" to `#<anchor>`. None low: "None of your scores is below the middle." plus "Next to practise: <lowest shift>" with that shift shown the same way. |
| U7 | Story 2 sc. 2 | Activating a section link scrolls the heading into view, focuses it, and leaves the fragment unchanged (research R6). |
| U8 | FR-010, FR-011 | "Print my focus areas" calls `window.print()`. With a result shown, `<html>` has `data-assessment-focus` and `body` has the focus sheet (`data-assessment-focus-sheet`) as a direct child; print media shows the sheet only (no header, footer, share area, post). The sheet holds the title, the date, "Mindsets to develop", the U6 shifts in the same order (each with "Read <name>: <full section address>") and "Results link: <url>", and nothing else. Without a result, print media shows the post with the statement list, not the form. |
| U9 | SC-003 | The printed sheet, with all five shifts low, fits on at most two pages on A4 and on US Letter. |
| U10 | FR-012, FR-015 | The results show the results link as text (wrapping anywhere) and a "Copy link" button (Clipboard API; on failure the text stays selectable), with one sentence: anyone with the link can see these scores, the site keeps no copy, and clearing does not undo a link already shared. The sheet prints the link. |
| U11 | FR-012, Story 4 | Rows L1–L6 of [results-link.md](./results-link.md). |
| U12 | FR-013 | Comparable earlier result: each chart row has two markers, new = filled circle, earlier = hollow diamond, with a text legend; summary lines add the change (`up 0.7`, `down 0.3`, `no change`). |
| U13 | FR-014 | Non-comparable: two separate result panels, no change text. |
| U14 | FR-015 | "Clear my answers": all radios unchecked, errors, results, earlier result, focus sheet and root attribute removed, fragment removed (L6), status says "Your answers have been cleared." |
| U15 | FR-016, SC-004 | No network request from answering, showing, following a section link, printing, copying or clearing. On a journey opened through a results link, a recorder of every request (`context.on("request")`, including service-worker, prefetch and beacon kinds) finds no URL, header (including `Referer`) or body containing the fragment, `result=` or an answer. No cookie, `localStorage`, `sessionStorage`, IndexedDB or Cache Storage entry is written, and `history.state` is unchanged. |
| U16 | FR-017, SC-005 | Only posts that render the block carry its loader, styles and title-card line; other pages' HTML has no reference to the module chunk and their shared scripts are unchanged. The module loads only when the block comes within one viewport height of the visible area (`IntersectionObserver` `rootMargin` of `100%` below) or at once when the fragment holds a result. |
| U17 | FR-018, SC-006 | No axe violations in light and dark in the empty, errors, results, comparison, separate-results and unreadable-link states; no horizontal scroll at 320 px (scales, chart rows, band phrases, results link), at 200% zoom, or with the WCAG text-spacing overrides; every control is operable by keyboard alone with a visible focus indicator; each answer choice and button is at least 24 x 24 CSS px; forced colours keep markers, tracks and legend visible. |
| U18 | Edge: JS off | The post reads in full; the Practical Application paragraphs are in the HTML; the block shows the note and the statement list; no form controls are visible. |
| U19 | CSP | The module sets no `style` attribute and no inline event handler; the page records no CSP violation through the whole journey. |
| U20 | FR-008, FR-009, FR-012 | Focus: after results show or update, focus stays on "Show my results"; after clear, focus is on the first statement's first radio; after a low-band link or the title-card link, the target heading (`tabindex="-1"`) has focus and the fragment is unchanged. Scrolling uses the page's scroll behaviour, which is smooth only under `prefers-reduced-motion: no-preference`. With a readable results link the title-card link reads "Your earlier result is below" and targets the earlier result's heading; otherwise it keeps "Take the self-assessment" and targets the assessment heading. |
| U22 | FR-001a | The block below the heading is one `<details>`, collapsed at load, whose `<summary>` reads "Take the self-assessment" (button styles, at least 24 x 24, visible focus ring, an indicator drawn in `currentColor` that stays visible in forced colours). Pointer, Enter and Space open and close it; it works with JavaScript off. It opens by itself for any `#result=` fragment (before the module runs, so the results-link visit keeps U21), and for a fragment or followed link naming an element inside it (the title-card link targets `#<heading id>-content`). Opening it loads the module if not yet loaded. With the module loaded, the title-card link opens it and focuses the assessment heading (or the earlier result's heading), fragment unchanged. Axe finds nothing in the collapsed state in either theme. In print without a result the statement list shows while collapsed and the summary does not print. |
| U21 | FR-018a | Opened through a results link at 320 px and 390 px wide, the layout-shift entries recorded before the first input (`hadRecentInput` false) sum to 0. |
