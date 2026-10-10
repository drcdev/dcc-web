# Contract: the contact email

Built by `buildContactEmail()` in `worker/src/contact/email.ts`; passed to
`env.CONTACT_EMAIL.send()` (Cloudflare `send_email` binding, structured builder API,
`EmailMessageBuilder` in `worker/worker-configuration.d.ts`).

## Exports

```ts
export const CONTACT_DESTINATION = "contact@doncoleman.ca";
export const CONTACT_SENDER = "contact-form@drc.dev";
export const CONTACT_SENDER_NAME = "doncoleman.ca contact form";
export function headerText(value: string): string;           // sanitiser, see Subject
export function safeReplyTo(email: string): string | undefined;
export function buildContactEmail(
  submission: ValidSubmission,
  options: { receivedAt: number; preview: boolean; host: string },
): EmailMessageBuilder;
```

## Builder fields

| Field | Value | Never |
|---|---|---|
| `to` | `CONTACT_DESTINATION` | taken from the request |
| `from` | `{ email: CONTACT_SENDER, name: CONTACT_SENDER_NAME }` | visitor text |
| `replyTo` | `safeReplyTo(submission.email)`; the key is absent when it returns `undefined` | the visitor's name, a display-name form, or more than one address |
| `subject` | see below | longer than 260 characters |
| `text` | see below | HTML |
| `cc`, `bcc`, `html`, `headers`, `attachments` | absent | present |

## Subject

```text
[Preview] Contact form: <headerText(name)> (about <headerText(project)>)
└─ only on preview ─┘                      └──── only when project is set ────┘
```

`headerText(value)`: replace every character in `\u0000-\u001f`, `\u007f-\u009f` (which includes
U+0085), `\u2028` and `\u2029` with a space, collapse whitespace runs to one space, trim (FR-004).
Examples:

| name / project in | Subject out |
|---|---|
| `Ada Lovelace` / null | `Contact form: Ada Lovelace` |
| `Ada\r\nBcc: x@y.z` / null | `Contact form: Ada Bcc: x@y.z` (one line, no header created) |
| `Ada\u0085Bcc: x` / null | `Contact form: Ada Bcc: x` |
| `Ada\u2028Bcc: x` / `Flux\u2029 X` | `Contact form: Ada Bcc: x (about Flux X)` |
| `Ada` / `Flux` | `Contact form: Ada (about Flux)` |
| preview, `Ada` / null | `[Preview] Contact form: Ada` |

## Reply-To

`safeReplyTo(email)` returns `email` unchanged when it contains exactly one `@` and none of:
whitespace, control characters, `<`, `>`, `,`, `;`, `"`, `(`, `)`, `\`. Otherwise `undefined`.

## Body (`text`)

```text
This message was sent from a preview deployment: <host>      ← preview only, then a blank line

Name: <name>
Email: <email>
Organization: <organization | "not given">
Project: <project | "not given">
Received: <new Date(receivedAt).toISOString() without milliseconds, e.g. 2026-10-10T17:04:11Z>

Message:
<message exactly as validated (trimmed), line breaks kept>
```

Lines end with `\n`. Values appear verbatim; nothing is interpreted as markup because the email is
`text/plain` only.

## Errors

`send()` rejects with an `Error` whose `code` is one of the binding's documented `E_*` codes
(for example `E_SENDER_NOT_VERIFIED`, `E_RECIPIENT_NOT_ALLOWED`, `E_RATE_LIMIT_EXCEEDED`,
`E_DELIVERY_FAILED`, `E_INTERNAL_SERVER_ERROR`). The handler does not retry; every rejection is
`503 unavailable` (see [contact-api.md](./contact-api.md)).
