// Ordering, landing selection, related posts and the home section (research
// R5; data-model.md "LandingSelection"; FR-006 to FR-009, FR-015, FR-029,
// FR-038). Pure functions over plain post summaries.
import { describe, expect, it } from "vitest";
import {
  selectLanding,
  selectRecent,
  selectRelated,
  sortNewestFirst,
} from "../../../src/lib/content/post-order.ts";

interface P {
  slug: string;
  title: string;
  date: Date;
  topics: string[];
  featured: boolean;
}

function post(slug: string, date: string, extra: Partial<P> = {}): P {
  return { slug, title: `Post ${slug}`, date: new Date(date), topics: ["a"], featured: false, ...extra };
}

const slugs = (posts: readonly { slug: string }[]) => posts.map((p) => p.slug);

describe("sortNewestFirst (FR-015)", () => {
  it("sorts by date, newest first", () => {
    const sorted = sortNewestFirst([post("a", "2026-01-01"), post("c", "2026-03-01"), post("b", "2026-02-01")]);
    expect(slugs(sorted)).toEqual(["c", "b", "a"]);
  });

  it("breaks a date tie by title ascending, ignoring case, in English collation", () => {
    const sorted = sortNewestFirst([
      post("x1", "2026-05-01", { title: "banana" }),
      post("x2", "2026-05-01", { title: "Apple" }),
      post("x3", "2026-05-01", { title: "cherry" }),
      post("x4", "2026-05-01", { title: "Éclair" }),
    ]);
    expect(slugs(sorted)).toEqual(["x2", "x1", "x3", "x4"]);
  });

  it("breaks a date and title tie by slug ascending", () => {
    const sorted = sortNewestFirst([
      post("b", "2026-05-01", { title: "Same" }),
      post("a", "2026-05-01", { title: "same" }),
      post("c", "2026-05-01", { title: "SAME" }),
    ]);
    expect(slugs(sorted)).toEqual(["a", "b", "c"]);
  });

  it("does not change the list it is given and is stable between calls", () => {
    const input = [post("b", "2026-05-01"), post("a", "2026-05-02")];
    const copy = [...input];
    const first = slugs(sortNewestFirst(input));
    expect(input).toEqual(copy);
    expect(slugs(sortNewestFirst([...input].reverse()))).toEqual(first);
  });
});

describe("selectLanding (FR-006 to FR-009)", () => {
  const many = (n: number, featuredSlugs: string[] = []) =>
    sortNewestFirst(
      Array.from({ length: n }, (_, i) =>
        post(`p${i + 1}`, `2026-01-${String(i + 1).padStart(2, "0")}`, { featured: featuredSlugs.includes(`p${i + 1}`) }),
      ),
    );

  it("has no lead, featured or latest for no posts", () => {
    expect(selectLanding([])).toEqual({ lead: undefined, featured: [], latest: [] });
  });

  it("makes the newest post the lead, with nothing else for one post", () => {
    const result = selectLanding(many(1));
    expect(result.lead?.slug).toBe("p1");
    expect(result.featured).toEqual([]);
    expect(result.latest).toEqual([]);
  });

  it("takes at most 3 featured posts, newest first, never the lead", () => {
    // p10 is newest (the lead) and featured; p9, p7, p5, p3 are featured too.
    const result = selectLanding(many(10, ["p10", "p9", "p7", "p5", "p3"]));
    expect(result.lead?.slug).toBe("p10");
    expect(slugs(result.featured)).toEqual(["p9", "p7", "p5"]);
  });

  it("takes at most 6 latest posts, newest first, none already shown", () => {
    const result = selectLanding(many(12, ["p7"]));
    expect(result.lead?.slug).toBe("p12");
    expect(slugs(result.featured)).toEqual(["p7"]);
    expect(slugs(result.latest)).toEqual(["p11", "p10", "p9", "p8", "p6", "p5"]);
  });

  it("leaves featured empty when no post is featured", () => {
    const result = selectLanding(many(5));
    expect(result.featured).toEqual([]);
    expect(slugs(result.latest)).toEqual(["p4", "p3", "p2", "p1"]);
  });

  it("leaves latest empty when everything else is featured or the lead", () => {
    const result = selectLanding(many(3, ["p1", "p2"]));
    expect(result.lead?.slug).toBe("p3");
    expect(slugs(result.featured)).toEqual(["p2", "p1"]);
    expect(result.latest).toEqual([]);
  });

  it("shows a post once", () => {
    const result = selectLanding(many(9, ["p2", "p4"]));
    const shown = [result.lead!, ...result.featured, ...result.latest].map((p) => p.slug);
    expect(new Set(shown).size).toBe(shown.length);
  });
});

describe("selectRelated (FR-029)", () => {
  const current = post("me", "2026-06-01", { topics: ["a", "b", "c"] });

  it("puts posts with the most shared topics first, then newest", () => {
    const others = [
      post("one-old", "2026-01-01", { topics: ["a"] }),
      post("two", "2026-02-01", { topics: ["a", "b"] }),
      post("one-new", "2026-05-01", { topics: ["c", "z"] }),
      post("three", "2026-01-15", { topics: ["c", "b", "a"] }),
    ];
    expect(slugs(selectRelated(current, [current, ...others]))).toEqual(["three", "two", "one-new"]);
  });

  it("never includes the post itself and returns at most 3", () => {
    const others = Array.from({ length: 6 }, (_, i) => post(`o${i}`, `2026-01-0${i + 1}`, { topics: ["a"] }));
    const result = selectRelated(current, [current, ...others]);
    expect(result).toHaveLength(3);
    expect(slugs(result)).not.toContain("me");
  });

  it("fills with the newest other posts when fewer than 3 share a topic", () => {
    const others = [
      post("shares", "2026-01-01", { topics: ["b"] }),
      post("n1", "2026-04-01", { topics: ["x"] }),
      post("n2", "2026-03-01", { topics: ["y"] }),
      post("n3", "2026-02-01", { topics: ["z"] }),
    ];
    expect(slugs(selectRelated(current, [current, ...others]))).toEqual(["shares", "n1", "n2"]);
  });

  it("uses the newest others when none share a topic", () => {
    const others = [post("n1", "2026-04-01", { topics: ["x"] }), post("n2", "2026-05-01", { topics: ["y"] })];
    expect(slugs(selectRelated(current, [current, ...others]))).toEqual(["n2", "n1"]);
  });

  it("is empty when there are no other posts", () => {
    expect(selectRelated(current, [current])).toEqual([]);
    expect(selectRelated(current, [])).toEqual([]);
  });
});

describe("selectRecent (FR-038)", () => {
  it("returns the 3 newest posts", () => {
    const posts = [post("a", "2026-01-01"), post("d", "2026-04-01"), post("b", "2026-02-01"), post("c", "2026-03-01")];
    expect(slugs(selectRecent(posts))).toEqual(["d", "c", "b"]);
  });

  it("returns fewer when there are fewer posts, and none for none", () => {
    expect(slugs(selectRecent([post("a", "2026-01-01")]))).toEqual(["a"]);
    expect(selectRecent([])).toEqual([]);
  });
});
