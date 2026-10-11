---
name: Preview
source: wrangler.jsonc
---

Every change gets a preview on one separate preview Worker, a small program that runs on Cloudflare's network. That Worker has its own preview database, apart from the live site's Worker and database, so nothing a preview does touches the live site. Emails sent from a preview are marked as previews. A preview also accepts Turnstile's test keys, which the live site does not.
