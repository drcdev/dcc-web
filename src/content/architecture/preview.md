---
name: Preview
source: wrangler.jsonc
---

Every change gets its own preview Worker and its own database, so nothing a preview does touches the live site. Emails sent from a preview are marked as previews. A preview also accepts Turnstile's test keys, which the live site does not.
