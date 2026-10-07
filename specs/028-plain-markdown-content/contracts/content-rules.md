# Contract: content authoring rules after 028

This replaces, for current behaviour, the section list in
`specs/003-standalone-pages/contracts/sections.md` (that file stays as a record).

## C1. Available sections

Exactly eight names, usable without an import in page (`src/content/pages/*.mdx`) and post
(`src/content/posts/*.mdx`) bodies:

`Lead`, `CallToAction`, `Figure`, `WideImage`, `FullImage`, `SideImage`, `ContactForm`,
`RecentWriting`.

Their props, rendered HTML and appearance are unchanged from today.

## C2. Rejecting anything else

| Input (outside fenced or inline code) | Result |
|---------------------------------------|--------|
| page body with `<TextBlock title="x">` | build fails: `Page file src/content/pages/<file>: <TextBlock> is not a section. The sections are: Lead, CallToAction, Figure, WideImage, FullImage, SideImage, ContactForm, RecentWriting.` |
| page body with `<Offerings>` or `<Offering title="x">` | same, naming that tag |
| post body with any of the three | same, prefixed `Post file …` |
| any of the three inside ```` ``` ```` fences or `` `inline code` `` | no error |
| project body with any section tag | fails as today (unchanged rule) |

The message text is produced by the existing `validatePageBody` / `contentError`; only the list of
names changes. The prefix wording comes from `contentError` and is unchanged.

## C3. Plain Markdown for standard content

Headings (`##`, `###`, …), paragraphs, lists, tables, quotes, links and emphasis are written as
Markdown. Each heading renders with an `id` (Astro built-in heading ids), so
`<page>#<id>` opens at the heading.

## C4. Work with me page (`/work-with-me/`)

On the built page, inside `<main>`:

- one `h1` (the page title);
- `h2`, in order: Speaking topics, Past talks, Consulting, Kinds of work, How I work,
  What I don't do;
- three `h3` after "Speaking topics" and three after "Kinds of work", none elsewhere;
- no heading level skipped;
- every `h2` and `h3` has a non-empty `id`, unique on the page, e.g. `/work-with-me/#consulting`;
- the lead paragraph first and the "Get in touch" call to action (to `/contact/`) last, as today;
- still a draft (draft notice, robots meta as today) and still menu position 2.

## C5. Authoring guides

- `docs/pages.md` states the rule once (plain Markdown for everything Markdown can express;
  components only for the eight in C1), has an example of each of the eight, shows a titled
  passage as `## Title` + text and a list of items as `###` headings, says how heading
  addresses are formed (including `-1` for repeats) and that links go in the heading or text,
  and contains no `<TextBlock`, `<Offerings` or `<Offering` (spec FR-008).
- `docs/posts.md`'s list of page sections usable in posts no longer names the removed three.
