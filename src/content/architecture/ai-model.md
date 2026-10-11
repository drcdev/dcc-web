---
name: Workers AI model
source: worker/src/questions/generate.ts
---

When a post has no saved questions and the shared budget allows it, the API asks a Cloudflare Workers AI model (Cloudflare's service for running AI models) to write them. The model only sees the text of the site's own posts. It never sees anything a visitor types.
