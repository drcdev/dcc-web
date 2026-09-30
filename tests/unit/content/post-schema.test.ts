// Unit tests for the post collection schema (data-model.md "Post"; contracts/
// build-errors.md rows P1 to P11; FR-031 to FR-033; research R1). `image()` is
// Astro's schema helper; a plain string stands in for it here so the schema can
// be tested without the content layer, as page-schema.test.ts does.
//
// Dates: Astro's glob loader parses front matter with js-yaml
// (`@astrojs/internal-helpers/frontmatter`). The spike (research "Spike
// results") found that parser turns an impossible date such as 2026-02-30 into
// 2 March and that `z.date()` also accepts a timestamp, so the raw front matter
// text is checked too (`assertPostDates`, research R1 fallback). Both checks are
// tested here through the real parser.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { topicIds } from "../../../src/config/topics.ts";
import { postSchema } from "../../../src/content/schemas/post.ts";
import { assertPostDates } from "../../../src/lib/content/post-dates.ts";

// `@astrojs/internal-helpers` is Astro's own dependency, so resolve it from Astro.
const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { parseFrontmatter } = (await import(
  pathToFileURL(fromAstro.resolve("@astrojs/internal-helpers/frontmatter")).href
)) as { parseFrontmatter: (code: string) => { frontmatter: Record<string, unknown>; rawFrontmatter: string } };

const schema = postSchema({ image: () => z.string() });

const minimal = {
  title: "Putting an AI agent in front of a legacy system",
  summary: "An agent can read screens faster than a new hire.",
  date: new Date("2026-08-27"),
  topics: ["agentic-ai"],
};

const full = {
  ...minimal,
  updated: new Date("2026-09-30"),
  topics: ["agentic-ai", "compliant-data"],
  featureImage: { src: "./images/agent.png", alt: "Two connected boxes", caption: "Where the agent sits" },
  featured: true,
  draft: true,
};

const omit = (value: object, key: string) => Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));
const rejects = (value: unknown) => expect(schema.safeParse(value).success).toBe(false);
const issues = (value: unknown) => JSON.stringify(schema.safeParse(value).error?.issues ?? []);

describe("postSchema, valid posts", () => {
  it("accepts a minimal post and defaults featured and draft to false", () => {
    const result = schema.safeParse(minimal);
    expect(result.success).toBe(true);
    expect(result.data?.featured).toBe(false);
    expect(result.data?.draft).toBe(false);
  });

  it("accepts a post with every setting", () => {
    expect(schema.safeParse(full).success).toBe(true);
  });

  it("trims the title and summary (P1, P2)", () => {
    const result = schema.safeParse({ ...minimal, title: "  Padded  ", summary: "  Also padded " });
    expect(result.data?.title).toBe("Padded");
    expect(result.data?.summary).toBe("Also padded");
  });

  it("keeps the order of topics, the first being the main topic (P5)", () => {
    const result = schema.safeParse({ ...minimal, topics: ["healthcare-leadership", "agentic-ai"] });
    expect(result.data?.topics).toEqual(["healthcare-leadership", "agentic-ai"]);
  });

  it("allows updated equal to date (P10)", () => {
    expect(schema.safeParse({ ...minimal, updated: minimal.date }).success).toBe(true);
  });

  it("allows a feature image without a caption", () => {
    expect(schema.safeParse({ ...minimal, featureImage: { src: "./a.png", alt: "A picture" } }).success).toBe(true);
  });
});

describe("postSchema, title and summary (P1, P2)", () => {
  it.each(["title", "summary"] as const)("rejects a missing, empty or blank %s, naming the key", (key) => {
    const without = omit(minimal, key);
    rejects(without);
    rejects({ ...minimal, [key]: "" });
    rejects({ ...minimal, [key]: "   " });
    expect(issues(without)).toContain(key);
    expect(issues({ ...minimal, [key]: "  " })).toContain(key);
  });
});

describe("postSchema, date and updated (P3, P4)", () => {
  it("rejects a missing date, naming date", () => {
    const without = omit(minimal, "date");
    rejects(without);
    expect(issues(without)).toContain("date");
  });

  it.each(["2026-08-27", "27/08/2026", "next tuesday", 20260827, null])(
    "rejects a date that is not a date value (%j)",
    (date) => {
      rejects({ ...minimal, date });
      expect(issues({ ...minimal, date })).toContain("date");
    },
  );

  it("rejects an invalid Date object", () => {
    rejects({ ...minimal, date: new Date("not a date") });
  });

  it("rejects updated that is not a date value", () => {
    rejects({ ...minimal, updated: "2026-09-30" });
    expect(issues({ ...minimal, updated: "soon" })).toContain("updated");
  });
});

describe("post front matter dates through the content YAML parser (P4, R1 fallback)", () => {
  const file = "src/content/posts/example.mdx";
  const source = (line: string) => `---\ntitle: T\n${line}\n---\nBody\n`;
  const parsedDate = (value: string) => parseFrontmatter(source(`date: ${value}`)).frontmatter.date;

  it("the parser alone rolls 2026-02-30 over to 2 March and z.date() accepts a timestamp", () => {
    // These are the facts the raw-text check exists for (research spike 3).
    expect((parsedDate("2026-02-30") as Date).toISOString().slice(0, 10)).toBe("2026-03-02");
    expect(z.date().safeParse(parsedDate("2026-08-27T10:30:00Z")).success).toBe(true);
  });

  it.each(["2026-08-27", "2026-02-28", "2024-02-29", "2026-12-31  # the publication date"])(
    "accepts date: %s",
    (value) => {
      expect(() => assertPostDates(file, source(`date: ${value}`))).not.toThrow();
      expect(z.date().safeParse(parsedDate(value.split(" ")[0]!)).success).toBe(true);
    },
  );

  it.each([
    '"2026-08-27"',
    "'2026-08-27'",
    "27/08/2026",
    "next tuesday",
    "2026-02-30",
    "2026-13-01",
    "2025-02-29",
    "2026-08-27T10:30:00Z",
    "2026-08-27 10:30:00",
    "2026-8-27",
    "",
  ])("rejects date: %j, naming the file and date", (value) => {
    const run = () => assertPostDates(file, source(`date: ${value}`));
    expect(run).toThrow(file);
    expect(run).toThrow("date");
    expect(run).toThrow("YYYY-MM-DD");
  });

  it("rejects the same mistakes in updated, naming updated", () => {
    for (const value of ['"2026-09-30"', "2026-02-30", "2026-09-30T00:00:00Z", "tomorrow"]) {
      const run = () => assertPostDates(file, source(`date: 2026-08-27\nupdated: ${value}`));
      expect(run).toThrow(file);
      expect(run).toThrow("updated");
    }
  });

  it("accepts a valid updated, and a post with no updated", () => {
    expect(() => assertPostDates(file, source("date: 2026-08-27\nupdated: 2026-09-30"))).not.toThrow();
    expect(() => assertPostDates(file, source("date: 2026-08-27"))).not.toThrow();
  });

  it("leaves a missing date to the schema", () => {
    expect(() => assertPostDates(file, source("title: No date"))).not.toThrow();
  });

  it("ignores date-like keys nested in other settings and in the body", () => {
    const text = `---\ntitle: T\ndate: 2026-08-27\nfeatureImage:\n  alt: x\n  date: next tuesday\n---\ndate: nonsense\n`;
    expect(() => assertPostDates(file, text)).not.toThrow();
  });
});

describe("postSchema, topics (P5 to P7)", () => {
  it("rejects a missing or empty topics list, naming topics", () => {
    const without = omit(minimal, "topics");
    rejects(without);
    rejects({ ...minimal, topics: [] });
    expect(issues(without)).toContain("topics");
    expect(issues({ ...minimal, topics: [] })).toContain("topics");
  });

  it("rejects an unknown topic, naming it and every allowed id in list order", () => {
    const text = issues({ ...minimal, topics: ["agentic-a1"] });
    expect(text).toContain("agentic-a1");
    const positions = topicIds.map((id) => text.indexOf(id));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("rejects the same topic twice, naming topics", () => {
    rejects({ ...minimal, topics: ["agentic-ai", "agentic-ai"] });
    expect(issues({ ...minimal, topics: ["agentic-ai", "agentic-ai"] })).toContain("topics");
  });

  it("rejects topics that are not a list", () => {
    rejects({ ...minimal, topics: "agentic-ai" });
  });
});

describe("postSchema, featureImage (P8, P9)", () => {
  it("rejects a feature image without alt or with empty alt, saying alt text", () => {
    for (const featureImage of [{ src: "./a.png" }, { src: "./a.png", alt: "" }, { src: "./a.png", alt: "  " }]) {
      rejects({ ...minimal, featureImage });
      expect(issues({ ...minimal, featureImage })).toContain("alt text");
    }
  });

  it("rejects a feature image without a src, and an empty caption", () => {
    rejects({ ...minimal, featureImage: { alt: "A picture" } });
    rejects({ ...minimal, featureImage: { src: "./a.png", alt: "A picture", caption: "" } });
  });

  it("checks src with the image() helper, so a missing file fails the build (P9)", () => {
    const seen: string[] = [];
    const tracked = postSchema({
      image: () =>
        z.string().refine((value) => {
          seen.push(value);
          return value !== "./images/missing.png";
        }, "Image ./images/missing.png does not exist"),
    });
    expect(tracked.safeParse({ ...minimal, featureImage: { src: "./images/ok.png", alt: "x" } }).success).toBe(true);
    const bad = tracked.safeParse({ ...minimal, featureImage: { src: "./images/missing.png", alt: "x" } });
    expect(bad.success).toBe(false);
    expect(seen).toContain("./images/missing.png");
  });

  it("rejects unknown keys inside featureImage", () => {
    rejects({ ...minimal, featureImage: { src: "./a.png", alt: "x", extra: 1 } });
  });
});

describe("postSchema, updated and strictness (P10, P11)", () => {
  it("rejects updated earlier than date, naming updated", () => {
    const value = { ...minimal, date: new Date("2026-08-27"), updated: new Date("2026-08-26") };
    rejects(value);
    expect(issues(value)).toContain("updated");
  });

  it("rejects an unknown or misspelled setting, naming it", () => {
    rejects({ ...minimal, sumary: "typo" });
    expect(issues({ ...minimal, sumary: "typo" })).toContain("sumary");
    rejects({ ...minimal, description: "a page setting" });
  });

  it("rejects featured and draft that are not true or false", () => {
    rejects({ ...minimal, featured: "yes" });
    rejects({ ...minimal, draft: "no" });
  });
});
