# Contract: assessment block (DOM and behaviour)

**Feature**: `037-wayfinder-self-assessment` | Research: [../research.md](../research.md) R3, R6–R10

`src/components/assessment/SelfAssessment.astro` renders the static parts; the lazily loaded
module `src/lib/assessment/client.ts` adds behaviour. Copy shown below in quotes is the plan's
default wording; tests assert structure and rules, not copy (docs/testing.md "Invariants, not
mirrors"). Rows are referenced as U1, U2, ... in tests.

## Static markup (build time)

```text
<section data-assessment="wayfinder" data-version="3fa9c2d0" data-assessment-data="{json}"
         aria-labelledby="<heading id from the Markdown ## above>" class="not-prose ...">
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
  <script> bootstrap (research R3) </script>
</section>
<style is:global> print rules (research R7) </style>
```

`data-assessment-data` carries only what the browser needs: shift names, from/to, anchors,
practical application text, week texts, integration week, scale labels, title. It is plain JSON
in an attribute (escaped by Astro); no inline script holds data.

## Behaviour rows

| Row | Requirement | Rule |
|-----|-------------|------|
| U1 | FR-001 | The block sits between the fifth shift section and "The Systems Leadership Wayfinder"; its heading is an `h2` in the page outline. |
| U2 | FR-002, FR-003 | 5 groups x 3 fieldsets x 5 labelled radios; every radio has a visible label; groups named by shift. |
| U3 | FR-006 | "Show my results" with any unanswered statement: no results, an error summary listing each unanswered statement (as links to its fieldset), `aria-invalid="true"` and a visible message on each, focus on the first unanswered radio. Answering a statement clears its error. |
| U4 | FR-007 | Complete answers: chart (one row per shift, From and To wording at the ends, marker at `(score - 1) / 4` of the track) and text summary list, one line per shift: `<name>: <score> of 5, <band phrase>`. |
| U5 | FR-009 | Showing or updating results sets the status region text; the results container follows the buttons in DOM order. |
| U6 | FR-008 | Each low-band shift: a link "Read <name>" to `#<anchor>` and its Practical Application paragraph. None low: "None of your scores is below the middle." plus "Next to practise: <lowest shift>" with its link and paragraph. |
| U7 | Story 2 sc. 2 | Activating a section link scrolls the heading into view, focuses it, and leaves the fragment unchanged (research R6). |
| U8 | FR-010, FR-011 | "Print my plan" calls `window.print()`. With a result shown, `<html>` has `data-assessment-plan` and `body` has the plan sheet as a direct child; print media shows the sheet only (no header, footer, share area, post). Without a result, print media shows the post with the statement list, not the form. |
| U9 | SC-003 | The printed sheet fits on at most two pages on A4 and on US Letter. |
| U10 | FR-012 | The results show the results link as text and a "Copy link" button (Clipboard API; on failure the text stays selectable). The sheet prints the link. |
| U11 | FR-012, Story 4 | Rows L1–L6 of [results-link.md](./results-link.md). |
| U12 | FR-013 | Comparable earlier result: each chart row has two markers, new = filled circle, earlier = hollow diamond, with a text legend; summary lines add the change (`up 0.7`, `down 0.3`, `no change`). |
| U13 | FR-014 | Non-comparable: two separate result panels, no change text. |
| U14 | FR-015 | "Clear my answers": all radios unchecked, errors, results, earlier result, plan sheet and root attribute removed, fragment removed (L6), status says "Your answers have been cleared." |
| U15 | FR-016, SC-004 | No network request from answering, showing, printing, copying or clearing. |
| U16 | FR-017 | Only posts that render the block carry its script; the module loads only when the block nears the viewport or the fragment holds a result. |
| U17 | FR-018, SC-006 | No axe violations in light and dark with results shown and with errors shown; no horizontal scroll at 320 px; the form is completable by keyboard alone; forced colours keep markers and tracks visible. |
| U18 | Edge: JS off | The post reads in full; the Practical Application paragraphs and the development plan are in the HTML; the block shows the note and the statement list; no form controls are visible. |
| U19 | CSP | The module sets no `style` attribute and no inline event handler; the page records no CSP violation through the whole journey. |
