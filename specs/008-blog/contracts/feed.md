# Contract: the feed

`/writing/rss.xml`, built by `src/pages/writing/rss.xml.ts` with `@astrojs/rss` (R11; US6;
FR-036, FR-037; SC-008).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dcterms="http://purl.org/dc/terms/">
  <channel>
    <title>Drift &amp; Convergence</title>
    <description>{feedDescription}</description>
    <link>{site}/</link>
    <language>en-ca</language>
    <item>
      <title>{title}</title>
      <link>{site}/writing/{slug}/</link>
      <guid isPermaLink="true">{site}/writing/{slug}/</guid>
      <description>{summary}</description>
      <pubDate>{RFC 822 date}</pubDate>
      <dcterms:modified>{ISO date}</dcterms:modified>   <!-- only when updated -->
    </item>
    …
  </channel>
</rss>
```

- Items: every post with `draft` false, newest first (date, then title, then slug; spec
  FR-015), on **every** build; drafts never appear, including on preview. Titles and summaries
  are XML-escaped text (a fixture title containing `&` and `<` proves it).
- `{site}` is the build's own origin (`resolveSiteOrigin`), so preview feeds point at the
  preview.
- No published posts: a valid channel with no items.
- Served as `application/rss+xml` or `application/xml` by Workers static assets.
- Tests: `tests/build/blog-listing.test.ts` parses the built feed as XML and checks items,
  order, absolute links, `dcterms:modified` and the absence of drafts; `quickstart.md` includes a
  manual W3C feed validator check on the preview.
