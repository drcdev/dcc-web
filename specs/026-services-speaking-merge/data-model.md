# Data Model: One Page for Services and Speaking

**Feature**: `026-services-speaking-merge` | **Plan**: [plan.md](./plan.md)

No schema changes. Every entity below already exists in the pages collection
(`src/content/schemas/page.ts`) and its registered sections; this feature changes which entries
exist and what one of them holds.

## Work with me page (pages collection entry)

File `src/content/pages/work-with-me.mdx` (renamed from `services.mdx`, research R1). Id
`work-with-me`, address `/work-with-me/`.

| Field | Value | Rule |
|---|---|---|
| `title` | `Work with me` | Page heading, tab title and (by default) menu label. |
| `description` | combined description (research R6) | Required by the schema; covers both kinds of work. |
| `nav.position` | `2` | Unique across pages and fixed entries; no `nav.label`. |
| `draft` | `true` | Stays a draft (FR-011); shows the draft notice. |

Body, in this order (FR-004), using only registered sections:

1. No-practice note: a plain paragraph.
2. `<Lead>`: one lead.
3. `<Offerings title="Kinds of work">` holding three `<Offering>`s: Advice on technology change,
   Workshops, Plan reviews.
4. `<TextBlock title="How I work">`.
5. `<TextBlock title="What I do not do">`.
6. `<Offerings title="Talk topics">` holding three `<Offering>`s: Systems thinking for technology
   leaders, Practical AI in healthcare, Leading change without formal authority.
7. `<TextBlock title="Past talks">`.
8. `<TextBlock title="For event organizers">` with the bio.
9. `<Figure caption="Don Coleman, for event programs">` with
   `./images/don-coleman.jpg` and its alt text.
10. `<CallToAction href="/contact/">`: the only call to action on the page (FR-005).

Validation: exactly one `<Lead>` and one `<CallToAction>`; exactly two `<Offerings>`, titled as
above, with three `<Offering>`s each; no other section type.

## Offering group / Offering

The existing `<Offerings title>` and `<Offering title>` sections. Six offerings, titles and
descriptions unchanged from today's pages.

## Removed entries

| Entry | Address | After |
|---|---|---|
| `services` | `/services/` | Renamed to `work-with-me`; no file at the old id. |
| `speaking` | `/speaking/` | Deleted. |

Both addresses then have no route; the not-found page answers them with HTTP 404.

## Header navigation (derived)

`mergeNavigation()` output after the change, in order:

| Position | Label | Address | Source |
|---|---|---|---|
| 1 | Home | `/` | `index.mdx` |
| 2 | Work with me | `/work-with-me/` | `work-with-me.mdx` |
| 4 | Writing | `/writing/` | fixed entry |
| 5 | Projects | `/projects/` | fixed entry |
| 6 | About | `/about/` | `about.mdx` |
| 7 | Contact | `/contact/` | fixed entry |

Six entries; position 3 is free.

## Launch configuration (`setup/config.json` `launch`)

- `expectedPages`: `services` and `speaking` replaced by one `work-with-me`.
- `expectedPaths`: `/services/` and `/speaking/` replaced by one `/work-with-me/`.

## Home intro call to action

`src/content/pages/index.mdx` `intro.cta.href`: `/services/` becomes `/work-with-me/`; the label
"See how I can help" is unchanged.
