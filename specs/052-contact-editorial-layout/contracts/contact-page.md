# Contract: contact page layout (`<ContactForm>` with a note)

This contract adds to `specs/007-contact-form/contracts/contact-page.md` (static markup, island
behaviour, CSP). Everything that contract says about the form, its ids, its script and its CSP
still holds unchanged. This file covers only the new wrapper, the note column, the quick links,
the privacy slot and the page file shape. Row ids (`L1`…) are for test titles.

## Page file shape (`src/content/pages/contact.mdx`)

```mdx
---
(front matter unchanged)
---

<ContactForm>
<div slot="note">

…note paragraphs in Markdown: conversations welcomed, reply expectation, location and time zone…

</div>

…the existing privacy paragraph, word for word, with its new-tab privacy policy link…

</ContactForm>
```

- **P1**: The note is the Markdown inside the one `<div slot="note">`, which is an immediate child
  of `<ContactForm>`. Blank lines inside the `div` let MDX parse the Markdown as paragraphs.
- **P2**: Every other child is the privacy paragraph (default slot). It is not inside the note.
- **P3**: The note contains no heading. The component draws the note's `h2`.
- **P4**: `<ContactForm />` with no children stays valid. It renders the form alone, as today.

## Rendered markup when the `note` slot is used

```html
<div class="not-prose mx-auto max-w-screen-lg lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12" data-contact>
  <section data-contact-note aria-labelledby="contact-note-heading" class="lg:col-span-5 …">
    <h2 id="contact-note-heading" class="…same classes as contact-form-heading…">Before you write</h2>
    <div data-contact-note-body class="…[&_p] [&_a] utilities…"><!-- note slot --></div>
    <ul data-contact-links class="…">
      <li><a href="{socialNavigation GitHub href}"><svg aria-hidden="true">…</svg><span>GitHub</span></a></li>
      <li><a href="{socialNavigation LinkedIn href}"><svg aria-hidden="true">…</svg><span>LinkedIn</span></a></li>
      <li><a href="mailto:{site.contactEmail}"><svg aria-hidden="true">…</svg><span>{site.contactEmail}</span></a></li>
    </ul>
  </section>
  <div data-contact-form-column class="mt-10 lg:col-span-7 lg:mt-0">
    <form id="contact-form" … aria-labelledby="contact-form-heading">
      <h2 id="contact-form-heading">Send a message</h2>
      <div data-contact-privacy class="mb-4 text-sm …"><!-- default slot --></div>
      <p id="contact-js-required">…</p>
      <p id="contact-required-note">…</p>
      … (every existing element, unchanged and in the same order)
    </form>
    <section id="contact-success" hidden …>…</section>
  </div>
</div>
```

| Row | Rule |
|-----|------|
| L1 | With a `note` slot, `[data-contact]` carries `lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12` (48 px gap). The note column is `lg:col-span-5` and the form column `lg:col-span-7` (FR-001). No other breakpoint changes the column count. |
| L2 | Below `lg` (1024 px) the two columns are blocks in source order. The note is first, and the form column has a top margin (FR-002). |
| L3 | DOM order is the note `h2`, the note body, `[data-contact-links]`, `#contact-form-heading`, `[data-contact-privacy]`, `#contact-js-required`, then the fields. No CSS reorders them, and no element has a positive `tabindex` (FR-003). |
| L4 | `#contact-note-heading` is an `h2` with the exact text "Before you write". It is the accessible name of `section[data-contact-note]` (FR-001a). |
| L5 | `[data-contact-links]` holds exactly three links in this order: one per `socialNavigation` entry (`href` and visible label from the entry), then `mailto:` + `site.contactEmail` with the address as its visible text and no query string (no subject or body). No link has a `target` attribute (FR-007, FR-007b). Every `socialNavigation` entry has an icon (FR-007c). |
| L6 | Every icon in `[data-contact-links]` is an `svg` with `aria-hidden="true"`. The link's accessible name is its visible text (FR-007). GitHub and LinkedIn use `src/icons/github.svg` and `linkedin.svg`. Email uses the new `src/icons/mail.svg`. |
| L7 | The note links have a visible focus outline (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500`, `dark:focus-visible:outline-accent-400`). In both themes they use the colour pairs the form and the home "open to" line already use (FR-015). |
| L8 | `[data-contact-privacy]` is inside `#contact-form`, after `#contact-form-heading` and before `#contact-js-required`. Its links are underlined (FR-008; e2e "privacy note"). |
| L9 | `#contact-success` is inside `[data-contact-form-column]`. When it replaces the form, the note column does not move (FR-014; edge case "Success panel height"). |
| L10 | The note and form columns have `min-w-0`, so a 100-character `?project=` value or a long error wraps inside its column and does not widen it (edge cases). |
| L11 | Each quick link is at least 24 px tall (`min-h-6`) and may wrap its text (`break-words`), one link per line. The note body is `max-w-prose lg:max-w-none` (FR-007c, FR-015, FR-017). |

## Rendered markup without a `note` slot (fixture-free use, P4)

| Row | Rule |
|-----|------|
| N1 | No `section[data-contact-note]`, no `[data-contact-links]` and no `lg:grid*` / `lg:col-span-*` classes are rendered. `[data-contact]` keeps `not-prose mx-auto max-w-screen-lg`. |
| N2 | With no default slot, no `[data-contact-privacy]` element is rendered. The form's markup is otherwise identical to the slotted case. |

## Unchanged (by reference)

- Every id, label, help text, field, the honeypot, `#contact-project`, `#contact-turnstile`,
  `#contact-status`, Send and `#contact-success` (FR-011, FR-012, FR-014).
- The island script, its lazy Turnstile load and its messages (FR-013, FR-014, FR-016).
- `allowTurnstile` in the component, plus the page route's `/<ContactForm\b/` check, which still
  matches the non-self-closing tag (FR-013).
