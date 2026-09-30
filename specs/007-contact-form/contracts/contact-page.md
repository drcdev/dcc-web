# Contract: Contact page and form (DOM and behaviour)

Page: `/contact/`, prerendered from `src/content/pages/contact.mdx` with `PageLayout`. Form:
the `ContactForm` section (`src/components/sections/ContactForm.astro`), registered in
`src/components/sections/index.ts` and `schemas.ts` (no props). Ported from Flux
`partials/ui-contact-form.hbs` (layout, classes, success and error states) and
`assets/js/contact-form.js` (submit behaviour), per research R12.

## Static markup (present with JavaScript off)

| Element | Selector / attributes | Notes |
|---|---|---|
| Heading | `h2#contact-form-heading` ("Send a message") | names the form (FR-008p); the page's single `h1` comes from `PageLayout` (title "Contact") |
| Form | `form#contact-form[novalidate][action="/api/contact"][method="post"][aria-labelledby=contact-form-heading]` | `novalidate` so the island shows its own accessible errors; without JavaScript only Send is disabled (below) |
| JavaScript notice | `#contact-js-required` (visible by default, first child of the form, before the fields) | "Sending this form needs JavaScript. You can still read how your information is handled in the privacy policy." Ordinary text, not `aria-hidden`. Hidden by the island on start (FR-008m) |
| Required note | `p#contact-required-note` before the fields | "All fields are required unless marked optional." (FR-008b) |
| Project line | `p#contact-project[hidden]` + `input[type=hidden][name=project]` | Filled by the island from `?project=`. Plain text, no `tabindex`, never focusable (FR-008a) |
| Name | `input#contact-name[name=name][required][maxlength=100][autocomplete=name]` + `<label for>` | |
| Email | `input#contact-email[type=email][name=email][required][maxlength=254][autocomplete=email]` + label | Flux icon kept, `aria-hidden` |
| Organization | `input#contact-organization[name=organization][maxlength=100][autocomplete=organization]` + label "Organization (optional)" | new field |
| Message | `textarea#contact-message[name=message][required][maxlength=5000][rows=6]` + label | |
| Consent | `input#contact-consent[type=checkbox][name=consent][required]` + `<label for>` holding the whole sentence, with the link inside it | wording per spec FR-003 (Flux's layout); link `a[href="/privacy-policy/"][target=_blank][rel=noopener]` with visible "(opens in a new tab)"; checkbox at least 24×24 CSS px (FR-008k) |
| Honeypot | `div.hidden[aria-hidden=true] > input[name=website][tabindex=-1][autocomplete=off]` | `display:none`, so it is not displayed, not focusable, not in the accessibility tree and not autofilled (FR-008d) |
| Turnstile slot | `div#contact-turnstile` after the consent box, before the status region and Send | empty until the first interaction (FR-008l) |
| Field errors | `p#contact-<field>-error` referenced by `aria-describedby`; the field gets `aria-invalid="true"` | text set only by the island; starts with the field name, plus an error icon (`aria-hidden`) so colour is never the only cue (FR-008e) |
| Status region | `div#contact-status[role=status][aria-live=polite]`, directly above Send | form-level errors, the error count and the sending announcement; cleared before each new message (FR-008g, FR-008h) |
| Submit | `button[type=submit]` (Flux gradient style) | `disabled` in markup; the island enables it |
| Success panel | `section#contact-success[hidden][tabindex=-1]` with a heading | focused on success |
| Privacy note | in `contact.mdx` above the form | FR-007; link text "privacy policy", underlined, `target=_blank rel=noopener`, with "(opens in a new tab)" |

The site key comes from `astro:env/client` (`PUBLIC_TURNSTILE_SITE_KEY`) and is written to
`data-sitekey` on `#contact-turnstile`. It is public by design.

## Island behaviour (processed `<script>` in the component)

1. On start: hide `#contact-js-required`, enable Send, create `submission_id`, and read
   `?project=` (trim, remove control characters, cut to 100). If the result is non-empty, fill
   the hidden input and show `#contact-project` with `textContent = "About: " + value`. Never
   use `innerHTML`.
2. On the first `focusin` or `input` inside the form: inject
   `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async>`
   once. On load, call `turnstile.render("#contact-turnstile", { sitekey, action: "contact", appearance: "interaction-only", "response-field": false, callback, "error-callback", "expired-callback" })`.
   No `integrity` attribute: Cloudflare updates `api.js` in place and requires it to be loaded
   directly from `challenges.cloudflare.com`, never pinned or proxied, so an SRI hash would
   break the widget on the next update. The page CSP limits the script to that one host
   instead.
   On script error or `error-callback`: show the Turnstile-failed-to-load message and keep all
   values.
3. On submit: check consent and fields with the shared `validateSubmission()`. On failure, set
   every invalid field's error at once, put "N fields need attention." in the status region,
   focus the first invalid field in form order and stop (FR-008f). If there is no token yet, show
   "Checking you're not a bot…" and wait up to 10 s for the callback; on timeout, show the
   load-failure message.
4. Send `fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body })`
   with a 15 s `AbortController` timeout. Send is disabled while in flight, the button text
   becomes "Sending…", and the status region says "Sending your message…" (FR-008i).
5. On `200`: hide the form, show and focus `#contact-success`, and create a new
   `submission_id` for any later message.
6. On any error: show the message from contracts/contact-api.md in `#contact-status` or on the
   field. Keep **every** typed value (SC-002) and re-enable Send. For a form-level error focus
   stays on Send (FR-008g). After a Turnstile failure or
   an expired token, call `turnstile.reset()`.
7. `pageshow` with `persisted`: reset visible state (ported from Flux), but keep field values.
8. No `console` output containing field values (FR-016), and nothing written to cookies,
   `localStorage` or `sessionStorage`.
9. `expired-callback` refreshes the Turnstile token silently, so there is no time limit on
   filling in the form (FR-008n). No animation is added; any transition is disabled under
   `prefers-reduced-motion: reduce`.

## Layout and visual rules

- The two-column name/email grid collapses to one column below the `sm` breakpoint, so the form
  reflows at 320 CSS px and at 400% zoom with no horizontal scrolling (FR-008n).
- Every control keeps a visible focus ring (the site's existing focus style). Field borders,
  the checkbox, the focus ring and error text use pairs that meet 4.5:1 (text) or 3:1
  (non-text) in both themes and every state, taking replacements from the design source's
  accessibility adjustments table where a Flux pairing fails.

## CSP (contact page only)

`ContactForm.astro` calls
`Astro.csp?.insertScriptResource("https://challenges.cloudflare.com")` and
`Astro.csp?.insertDirective("frame-src https://challenges.cloudflare.com")`
(docs.astro.build/en/reference/api-reference/#csp). `tests/unit/site/csp.test.ts` gains a case
that asserts these appear on `/contact/` only and the site-wide policy is unchanged.
`tests/e2e/csp-violations.ts` must report none on `/contact/` through a full submission.

## Test hooks

- `tests/e2e/templates.ts` gains `{ name: "contact", path: "/contact/", built: true }`, so the
  shell, no-JS, a11y, budget and visual projects cover it automatically. New visual baselines
  are needed on macOS and Linux (CLAUDE.md "Visual baselines").
- `tests/e2e/contact.spec.ts` covers the journeys in quickstart.md.
- `tests/component/sections/ContactForm.test.ts` (Astro Container API, as the existing
  component tests do) covers the static markup table above.
