# Data model: Two-column editorial layout for the contact page

No storage, schema or API change. The "entities" are pieces of page content and configuration.

## Contact note

- **Where**: the `<div slot="note">` child of `<ContactForm>` in `src/content/pages/contact.mdx`.
- **Fields**: Markdown paragraphs only. Links are allowed. Headings are not, because the component
  owns the `h2` "Before you write".
- **Rules**:
  - States the conversations Don welcomes (speaking and mentoring; topics systems leadership and
    AI experiments), the reply expectation (reads every message, replies by email within a few
    days), and "Vancouver Island, BC — Pacific Time" (FR-004 to FR-006).
  - No consulting invitation, no job title, plain language (FR-004, FR-010).
  - Readable without JavaScript: it is static HTML (FR-009).
- **Validation**: `validatePageBody` already rejects a level-1 heading and any unknown capitalised
  tag. No new schema rule is added. The note is optional for the component (`ContactForm`'s
  section schema stays `section({})`), and the one real page always supplies it.

## Privacy notice

- **Where**: the default-slot children of `<ContactForm>` in `contact.mdx`, i.e. the existing
  paragraph, moved inside the element and kept word for word.
- **Rules**: it keeps the retention statement and the new-tab `/privacy-policy/` link
  (`site-pages.test.ts`, "Contact note (FR-015)"). It renders inside the form, under
  "Send a message" (FR-008).

## Quick link

| Field | Source |
|-------|--------|
| label | `NavigationItem.label` from `socialNavigation` (GitHub, LinkedIn); for email, the address itself |
| href | `NavigationItem.href`; for email, `mailto:` + `site.contactEmail` |
| icon | `src/icons/github.svg`, `src/icons/linkedin.svg`, `src/icons/mail.svg` (new), keyed by label as in `SiteFooter.astro` |

- **Order**: `socialNavigation` order, then email.
- **Behaviour**: same tab (no `target`). The icon is decorative and the visible label is the
  accessible name.

## Site configuration (`src/config/site.ts`)

- **New field**: `contactEmail: string` on `SiteConfig`, value `contact@doncoleman.ca`, with a
  doc comment saying it is the public address shown on the contact page and published in the
  privacy policy.
- **Invariant**: `privacy-policy.mdx` and `terms-of-use.mdx` contain `mailto:${site.contactEmail}`
  (unit test, `tests/unit/site/privacy-policy.test.ts`).
- **Not the same as** `CONTACT_DESTINATION` (`worker/src/contact/email.ts`), the delivery address
  for form emails (Principle VII). The two have the same value today but are separate facts.
