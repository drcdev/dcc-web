---
name: Production
source: wrangler.jsonc
---

The live site at www.doncoleman.ca is one Cloudflare Worker, a small program that runs on Cloudflare's network. It serves the built pages as plain files and runs code only for requests that start with /api/. It has its own database, separate from every preview.
