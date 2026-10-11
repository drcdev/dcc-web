---
name: Email sending
source: worker/src/contact/email.ts
---

Once the bot check passes, the API sends the message as a plain-text email through Cloudflare Email Routing. It sends it from a separate sending address. Nothing is written to a database, file or log, and your IP address is not kept.
