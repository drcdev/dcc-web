---
name: Static pages
source: src/pages
---

The site is built with Astro, which turns every page into a plain file ahead of time. All writing and pages are Markdown or MDX files in the site's repository, checked when the site is built so a bad page fails the build. Cloudflare serves the files without running any code. That is why pages load fast and stay readable with JavaScript turned off.
