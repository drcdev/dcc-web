# Contract: project hand-off to the contact form

Owner: this feature defines the link; the contact feature (built in parallel) decides what the
form does with it. Neither feature depends on the other's code.

## Link

```
/contact/?project=<slug>
```

- Path: `/contact/`, the address already reserved in `futureDestinations`
  (`src/config/navigation.ts`), with the site's trailing slash.
- Query: exactly one parameter, `project`.
- Value: the project's slug, matching `^[a-z0-9-]{1,64}$` (for the sample, `focus-pocus`). No
  title, free text, or personal data is ever carried.
- The link is a plain `<a href>`; it works with JavaScript off.
- Link text is plain language, for example "Get in touch about a problem like this", inside
  the stage headed "Have a problem like this?". The accessible name says the project, e.g.
  visible text plus "about Focus Pocus" in the same link.

## What the contact form may do (guidance for the contact feature, not built here)

- Read `project` from the query string at request or page time.
- If it matches a known project slug, show the project's title as the enquiry's subject
  (for example a read-only "About: Focus Pocus" line or a pre-selected field) and send the slug
  with the submission.
- If it is missing, malformed or unknown, ignore it silently and show the normal form.
- Never echo the raw value into the page without escaping; never log it with personal data.

## States on the preview deployment

- While the contact feature has not merged, `/contact/?project=focus-pocus` serves the site's
  not-found page with status 404. This is accepted by the spec (Assumptions) and is not a test
  failure: the E2E test checks the link's `href`, not the response of the target.

## Tests (this feature)

- Unit: `contactHref("focus-pocus") === "/contact/?project=focus-pocus"`; `contactHref("Focus
  Pocus")` throws.
- Component and E2E: every direction's invitation link has exactly that `href`, is visible
  with JavaScript off, and is the last stage of the story.
