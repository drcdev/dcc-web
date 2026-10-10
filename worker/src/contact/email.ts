// The one destination and the one sender of contact email (Constitution VII). Fixed in committed
// configuration, never taken from a request. wrangler.jsonc's `send_email` binding repeats both
// values; tests/unit/site/config-files.test.ts keeps the two in step.

/** The only address a contact submission is ever emailed to (verified in Email Routing). */
export const CONTACT_DESTINATION = "contact@doncoleman.ca";

/** The sender address, on the Email Routing sending subdomain. */
export const CONTACT_SENDER = "contact-form@mail.doncoleman.ca";

/** Display name shown on the From line. */
export const CONTACT_SENDER_NAME = "doncoleman.ca contact form";
