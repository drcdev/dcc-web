// shareLinks (data-model.md "Share links"; FR-028): plain links carrying only the
// post's title and address, with no tracking or campaign parameters.
import { describe, expect, it } from "vitest";
import { shareLinks } from "../../../src/lib/share.ts";

const url = "https://example.test/writing/one/";

describe("shareLinks", () => {
  it("builds the LinkedIn share-offsite address with the encoded post address", () => {
    const { linkedin } = shareLinks("A title", url);
    expect(linkedin).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
  });

  it("builds a mailto: with an encoded subject and body", () => {
    const { email } = shareLinks("Tom & Jerry: 100% #1?", url);
    expect(email.startsWith("mailto:?")).toBe(true);
    const params = new URLSearchParams(email.slice("mailto:?".length));
    expect(params.get("subject")).toBe("Tom & Jerry: 100% #1?");
    expect(params.get("body")).toBe(url);
    expect([...params.keys()]).toEqual(["subject", "body"]);
    // A space is %20, never a plus sign, which mail clients show literally.
    expect(shareLinks("a b", url).email).toContain("subject=a%20b");
  });

  it("adds no tracking or campaign parameters", () => {
    for (const link of Object.values(shareLinks("A title", url))) {
      expect(link).not.toMatch(/utm_|ref=|campaign|source/i);
    }
    expect(new URL(shareLinks("t", url).linkedin).searchParams.get("url")).toBe(url);
  });
});
