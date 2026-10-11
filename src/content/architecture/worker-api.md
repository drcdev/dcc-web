---
name: Worker API
source: worker/src/index.ts
---

The Worker, a small program that runs on Cloudflare's network, handles requests that start with /api/ and nothing else. It accepts them only from this site's own pages. It handles the questions requests and the contact form requests, and hands each to its own code.
