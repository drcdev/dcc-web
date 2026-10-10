// The one destination and the one sender of contact email (Constitution VII). Fixed in committed
// configuration, never taken from a request. wrangler.jsonc's `send_email` binding repeats both
// values; tests/unit/site/config-files.test.ts keeps the two in step.
import type { ValidSubmission } from "./rules";

/** The only address a contact submission is ever emailed to (verified in Email Routing). */
export const CONTACT_DESTINATION = "contact@doncoleman.ca";

/** The sender address, on the separate sending domain drc.dev (Email Routing is on there), so
 * doncoleman.ca's own mail records are never touched. */
export const CONTACT_SENDER = "contact-form@drc.dev";

/** Display name shown on the From line. */
export const CONTACT_SENDER_NAME = "doncoleman.ca contact form";

// Subject text (FR-004): every control character and Unicode line separator becomes a space, so
// visitor text can never start a new header line. Built from a string so the source holds no
// literal U+2028 or U+2029.
const HEADER_UNSAFE = new RegExp("[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029]", "g");

export function headerText(value: string): string {
  return value.replace(HEADER_UNSAFE, " ").replace(/\s+/g, " ").trim();
}

// Reply-To carries exactly one plain address. Anything that could add a name, a second address
// or a header is dropped, and the email goes out without Reply-To.
const REPLY_TO_UNSAFE = /[\s\u0000-\u001f\u007f-\u009f<>,;"()\\]/;

export function safeReplyTo(email: string): string | undefined {
  if (email.split("@").length !== 2) return undefined;
  return REPLY_TO_UNSAFE.test(email) ? undefined : email;
}

export interface BuildOptions {
  receivedAt: number;
  preview: boolean;
  host: string;
}

export function buildContactEmail(submission: ValidSubmission, options: BuildOptions): EmailMessageBuilder {
  const project = submission.project === null ? "" : headerText(submission.project);
  const subject =
    `${options.preview ? "[Preview] " : ""}Contact form: ${headerText(submission.name)}` +
    (project === "" ? "" : ` (about ${project})`);

  const received = new Date(options.receivedAt).toISOString().replace(/\.\d{3}Z$/, "Z");
  const text =
    (options.preview ? `This message was sent from a preview deployment: ${options.host}\n\n` : "") +
    `Name: ${submission.name}\n` +
    `Email: ${submission.email}\n` +
    `Organization: ${submission.organization ?? "not given"}\n` +
    `Project: ${submission.project ?? "not given"}\n` +
    `Received: ${received}\n` +
    `\nMessage:\n${submission.message}\n`;

  const replyTo = safeReplyTo(submission.email);
  return {
    to: CONTACT_DESTINATION,
    from: { email: CONTACT_SENDER, name: CONTACT_SENDER_NAME },
    ...(replyTo === undefined ? {} : { replyTo }),
    subject,
    text,
  };
}
