# Contract: Work with me page, menu and removed addresses

**Feature**: `026-services-speaking-merge` | **Plan**: [../plan.md](../plan.md)

What a visitor, a crawler and the launch check can observe once the feature lands. Tests are
written against this contract.

## `/work-with-me/` (built page)

- HTTP 200, prerendered HTML, readable with JavaScript off.
- One `<h1>`: "Work with me". `<title>` and `og:title` built from it as on every page.
- `<meta name="description">` is "The talks Don Coleman gives and the consulting work he is considering taking on."
- Shows the draft notice (`data-draft-notice`) and the draft robots meta, as Services did.
- Inside `main`, in document order: the lead (the page opens with it), an `h2` "Speaking topics"
  followed by its three offering titles, `h2` "Past talks", `h2` "Consulting" (holding the
  no-practice note and the healthcare-gaps paragraph), `h2` "Kinds of work", `h2` "How I work"
  followed by its three offering titles, `h2` "What I don't do", then one call to action labelled
  "Get in touch". No `figure`, no bio, no `talk-topics` id.
- Exactly one call-to-action link in `main` content sections pointing to `/contact/`.
- Passes the per-template axe check (WCAG 2.2 AA) and the performance budget.

## Header menu (every page)

- Desktop and phone (open menu), with and without JavaScript: six links in this order —
  Home `/`, Work with me `/work-with-me/`, Writing `/writing/`, Projects `/projects/`,
  About `/about/`, Contact `/contact/`. No "Services" or "Speaking" link.
- On `/work-with-me/` only that link has `aria-current="page"`.
- Desktop (1280 px) shows the six links in one row with the site name; phone (390 px) shows each
  open-menu link on its own line with no overflow.

## Home page

- The introduction card's "See how I can help" link has `href="/work-with-me/"`.

## Removed addresses

- `GET /services/`, `/services`, `/speaking/`, `/speaking` and any address below them: HTTP 404
  with the site's not-found page. No `Location` header.
- `public/_redirects` contains no rule naming `/services` or `/speaking`.
- No built HTML file links to `/services/` or `/speaking/`; the sitemap lists `/work-with-me/`
  once and neither old address.

## Launch readiness check (setup item 25) and config

- `setup/config.json` `launch.expectedPages` includes `work-with-me` and neither `services` nor
  `speaking`; `launch.expectedPaths` includes `/work-with-me/` and neither old path.
- With the page still a draft the check reports `work-with-me: page is still a draft` and no
  missing-file problem for `services` or `speaking`.
- `docs/launch.md` L2 names the "Work with me" page, not Services and Speaking.
