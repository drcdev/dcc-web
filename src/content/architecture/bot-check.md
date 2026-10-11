---
name: Turnstile bot check
source: worker/src/contact/turnstile.ts
---

Cloudflare Turnstile checks that a person, not a script, is sending the contact form. The widget in your browser gets a token. The API sends that token to Cloudflare to confirm it before it does anything with the message.
