# Contract: Contact page and form (DOM and behaviour)

Page: `/contact/`, prerendered from `src/content/pages/contact.mdx` with `PageLayout`. Form:
the `ContactForm` section (`src/components/sections/ContactForm.astro`), registered in
`src/components/sections/index.ts` and `schemas.ts` (no props). Ported from Flux
`partials/ui-contact-form.hbs` (layout, classes, success and error states) and
`assets/js/contact-form.js` (submit behaviour), per research R12.

## Static markup (present with JavaScript off)

| Element | Selector / attributes | Notes |
|---|---|---|
| Form | `form#contact-form[novalidate][action="/api/contact"][method="post"]` | `novalidate` so the island shows its own accessible errors; without JavaScript the form is disabled (below) |
| JavaScript notice | `#contact-js-required` (visible by default) | "Sending this form needs JavaScript. You can still read how your information is handled in the privacy policy." Hidden by the island on start |
| Project line | `#contact-project[hidden]` + `input[type=hidden][name=project]` | Filled by the island from `?project=` |
| Name | `input#contact-name[name=name][required][maxlength=100][autocomplete=name]` + `<label for>` | |
| Email | `input#contact-email[type=email][name=email][required][maxlength=254][autocomplete=email]` + label | Flux icon kept, `aria-hidden` |
| Organization | `input#contact-organization[name=organization][maxlength=100][autocomplete=organization]` + label "Organization (optional)" | new field |
| Message | `textarea#contact-message[name=message][required][maxlength=5000][rows=6]` + label | |
| Consent | `input#contact-consent[type=checkbox][name=consent][required]` + label linking `/privacy-policy/` | wording from Flux, with a trailing slash on the link |
| Honeypot | `div.hidden[aria-hidden=true] > input[name=website][tabindex=-1][autocomplete=off]` | real visitors never see or reach it |
| Turnstile slot | `div#contact-turnstile` | empty until the first interaction |
| Field errors | `p#contact-<field>-error` referenced by `aria-describedby`; the field gets `aria-invalid="true"` | text set only by the island |
| Status region | `div#contact-status[role=status][aria-live=polite]` | general errors and the "Sending…" state |
| Submit | `button[type=submit]` (Flux gradient style) | `disabled` in markup; the island enables it |
| Success panel | `section#contact-success[hidden][tabindex=-1]` with a heading | focused on success |
| Privacy note | in `contact.mdx` above the form | FR-007; links `/privacy-policy/` |

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
   each field's error, focus the first invalid field and stop. If there is no token yet, show
   "Checking you're not a bot…" and wait up to 10 s for the callback; on timeout, show the
   load-failure message.
4. Send `fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body })`
   with a 15 s `AbortController` timeout. Send is disabled while in flight, and the button text
   becomes "Sending…".
5. On `200`: hide the form, show and focus `#contact-success`, and create a new
   `submission_id` for any later message.
6. On any error: show the message from contracts/contact-api.md in `#contact-status` or on the
   field. Keep **every** typed value (SC-002) and re-enable Send. After a Turnstile failure or
   an expired token, call `turnstile.reset()`.
7. `pageshow` with `persisted`: reset visible state (ported from Flux), but keep field values.
8. No `console` output containing field values (FR-016).

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
