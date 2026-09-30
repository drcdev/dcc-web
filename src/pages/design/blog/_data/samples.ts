// Sample data for the blog design prototypes (specs/005-blog-design-directions/data-model.md).
// Plain TypeScript, no Astro imports, so Vitest and Playwright can read it too.
// Feature images are referenced by id; the Astro components resolve the id to
// an imported image in ./images.ts. Prototype-only: deleted with the prototypes.

export type DirectionId = "a" | "b" | "c";
export type ImageId = "pipeline" | "teams" | "agents" | "records" | "clinic";
export type Tone = "rust" | "sage" | "lavender" | "mist";
export type BodyKind = "full-with-image" | "full-no-image" | "short";

export interface Topic {
  slug: string;
  name: string;
  intro: string;
  tone: Tone;
}

export interface SamplePost {
  slug: string;
  title: string;
  date: string;
  readingMinutes: number;
  topics: string[];
  summary: string;
  featured: boolean;
  image?: { id: ImageId; alt: string };
  body: BodyKind;
}

export interface DesignDirection {
  id: DirectionId;
  name: string;
  summary: string;
  topicPresentation: string;
  addresses: { post: string; landing: string; all: string; allPage: string; topic: string };
  newColoursOrFonts: string[];
  noFeaturedBehaviour: string;
}

export const PAGE_SIZE = 5;

export const topics: Topic[] = [
  {
    slug: "compliant-data",
    name: "High-compliance data and integration",
    intro:
      "Moving regulated data between systems without losing track of who saw it, why, and for how long. Notes on contracts, audit trails and retention.",
    tone: "rust",
  },
  {
    slug: "high-performing-teams",
    name: "High-performing technology teams",
    intro:
      "What makes a technology team dependable over years, not sprints: handoffs, on-call, ownership and the habits that keep them healthy.",
    tone: "sage",
  },
  {
    slug: "agentic-ai-legacy",
    name: "Agentic AI in legacy environments",
    intro:
      "Where AI agents help and where they hurt when the systems around them are old, undocumented and still running the business.",
    tone: "lavender",
  },
  {
    slug: "healthcare-leadership",
    name: "Healthcare technology leadership",
    intro:
      "Leading technology where an outage is felt by patients and clinicians, and where the pace of change is set by people, not tools.",
    tone: "mist",
  },
];

export const posts: SamplePost[] = [
  {
    slug: "quiet-handoffs",
    title: "Why the quiet handoffs decide whether a team ships",
    date: "2026-09-15",
    readingMinutes: 1,
    topics: ["high-performing-teams"],
    summary:
      "Most delivery problems start in the gaps between people. Four small habits that make a handoff boring, and why boring is the goal.",
    featured: false,
    body: "short",
  },
  {
    slug: "ai-agents-and-the-mainframe",
    title: "Putting an AI agent in front of a system nobody wants to touch",
    date: "2026-08-27",
    readingMinutes: 3,
    topics: ["agentic-ai-legacy", "compliant-data"],
    summary:
      "An agent can read a legacy system's screens faster than a new hire, but it cannot tell you which of them are safe to change. What we automated, and what stayed human.",
    featured: true,
    image: {
      id: "agents",
      alt: "Two boxes joined by a stepped line, one representing an agent and one a legacy system.",
    },
    body: "full-with-image",
  },
  {
    slug: "audit-trail-as-a-product",
    title: "Treat the audit trail as a product, not a by-product",
    date: "2026-08-06",
    readingMinutes: 1,
    topics: ["compliant-data"],
    summary:
      "If an auditor is a user, the audit trail needs a design, an owner and a roadmap. What changed when we started treating it that way.",
    featured: true,
    image: {
      id: "records",
      alt: "Four stacked record rows with short highlighted entries.",
    },
    body: "short",
  },
  {
    slug: "what-a-clinic-taught-me-about-uptime",
    title: "What a clinic waiting room taught me about uptime",
    date: "2026-07-14",
    readingMinutes: 1,
    topics: ["healthcare-leadership"],
    summary:
      "An outage looks different from the front desk. A short story about a slow morning, and how it changed the way we talk about availability.",
    featured: true,
    image: {
      id: "clinic",
      alt: "A cross inside a circle, standing for a clinic.",
    },
    body: "short",
  },
  {
    slug: "reading-a-system-you-did-not-build",
    title: "Reading a system you did not build",
    date: "2026-06-23",
    readingMinutes: 3,
    topics: ["agentic-ai-legacy", "high-performing-teams"],
    summary:
      "A practical order for learning an unfamiliar codebase: start with the data, then the jobs, then the people who wake up when it breaks.",
    featured: false,
    body: "full-no-image",
  },
  {
    slug: "small-teams-large-interfaces",
    title: "Small teams, large interfaces: keeping ownership clear as systems grow",
    date: "2026-05-29",
    readingMinutes: 1,
    topics: ["high-performing-teams", "compliant-data"],
    summary:
      "The team stays small, the number of interfaces does not. How we decided who owns each boundary and what that saved us in incident reviews.",
    featured: false,
    image: {
      id: "teams",
      alt: "Three circles above three half-circles, standing for a small team.",
    },
    body: "short",
  },
  {
    slug: "three-years-between-a-hospital-two-labs-and-a-payer",
    title:
      "Three years of integration work between a hospital, two labs and a payer, and the one rule we kept breaking every quarter",
    date: "2026-05-05",
    readingMinutes: 1,
    topics: ["compliant-data", "high-performing-teams", "agentic-ai-legacy"],
    summary:
      "The rule was simple: never change a message format and its consumers in the same release. Why it was so hard to keep, and what finally worked.",
    featured: false,
    image: {
      id: "pipeline",
      alt: "A branching line joining six connected points.",
    },
    body: "short",
  },
  {
    slug: "retention-rules-in-plain-language",
    title: "Retention rules in plain language",
    date: "2026-04-11",
    readingMinutes: 1,
    topics: ["compliant-data"],
    summary:
      "How long you keep data is a decision, and it should be written where the people who make it can read it. A template that fits on one page.",
    featured: false,
    body: "short",
  },
  {
    slug: "when-the-pilot-outlives-the-plan",
    title: "When the pilot outlives the plan",
    date: "2026-03-18",
    readingMinutes: 1,
    topics: ["agentic-ai-legacy"],
    summary:
      "Every AI pilot has an end date on the slide and none in practice. Questions worth asking before a pilot quietly becomes production.",
    featured: false,
    image: {
      id: "agents",
      alt: "Two boxes joined by a stepped line, one representing an agent and one a legacy system.",
    },
    body: "short",
  },
  {
    slug: "on-call-without-heroics",
    title: "On-call without heroics",
    date: "2026-02-24",
    readingMinutes: 1,
    topics: ["high-performing-teams"],
    summary:
      "A rota that depends on one person who always answers is a risk, not a strength. How we spread the load and wrote down what people actually do at 3 a.m.",
    featured: true,
    image: {
      id: "teams",
      alt: "Three circles above three half-circles, standing for a small team.",
    },
    body: "short",
  },
  {
    slug: "schema-changes-are-people-changes",
    title: "Schema changes are people changes",
    date: "2026-01-30",
    readingMinutes: 1,
    topics: ["compliant-data"],
    summary:
      "The migration script is the easy part. The hard part is the reports, exports and spreadsheets that quietly depend on the old shape.",
    featured: false,
    body: "short",
  },
  {
    slug: "first-ninety-days-of-a-legacy-rescue",
    title: "The first ninety days of a legacy rescue",
    date: "2025-11-19",
    readingMinutes: 1,
    topics: ["agentic-ai-legacy", "high-performing-teams"],
    summary:
      "A plan for the first three months of taking over a system in trouble: what to measure, what to leave alone, and when to say no.",
    featured: false,
    image: {
      id: "pipeline",
      alt: "A branching line joining six connected points.",
    },
    body: "short",
  },
  {
    slug: "data-contracts-between-friends",
    title: "Data contracts between friends",
    date: "2025-09-08",
    readingMinutes: 1,
    topics: ["compliant-data"],
    summary:
      "Two teams that trust each other still need a written agreement about their data. What goes in a one-page contract and who signs it.",
    featured: false,
    image: {
      id: "records",
      alt: "Four stacked record rows with short highlighted entries.",
    },
    body: "short",
  },
];

// Derived values ------------------------------------------------------------

export const byNewest: SamplePost[] = [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export const featuredPosts: SamplePost[] = byNewest.filter((post) => post.featured);

export function topicBySlug(slug: string): Topic {
  const topic = topics.find((t) => t.slug === slug);
  if (!topic) throw new Error(`Unknown sample topic "${slug}"`);
  return topic;
}

export function postsInTopic(slug: string): SamplePost[] {
  return byNewest.filter((post) => post.topics.includes(slug));
}

/** Other posts sharing the most topics, ties by newest; newest others when few share a topic (FR-011). */
export function relatedTo(post: SamplePost, n = 3): SamplePost[] {
  const shared = (other: SamplePost) => other.topics.filter((t) => post.topics.includes(t)).length;
  return byNewest
    .filter((other) => other.slug !== post.slug)
    .map((other, index) => ({ other, score: shared(other), index }))
    .sort((x, y) => y.score - x.score || x.index - y.index)
    .slice(0, n)
    .map(({ other }) => other);
}

// Addresses -----------------------------------------------------------------

/** The address the direction proposes for the real blog post; never contains a topic (FR-012). */
export function proposedAddress(direction: DirectionId, post: SamplePost): string {
  return direction === "c" ? `/writing/${post.date.slice(0, 4)}/${post.slug}/` : `/writing/${post.slug}/`;
}

/** Maps a real-blog address (`/writing/...`) to the same screen under `/design/blog/{direction}/...`. */
export function prototypeAddress(direction: DirectionId, realAddress: string): string {
  if (!realAddress.startsWith("/writing/")) throw new Error(`Not a blog address: ${realAddress}`);
  return `/design/blog/${direction}/${realAddress.slice("/writing/".length)}`;
}

export const landingPath = (direction: DirectionId) => prototypeAddress(direction, "/writing/");

export const listingPath = (direction: DirectionId, page = 1) =>
  prototypeAddress(direction, page <= 1 ? "/writing/all/" : `/writing/all/${page}/`);

export const topicPath = (direction: DirectionId, slug: string) =>
  prototypeAddress(direction, direction === "c" ? `/writing/${slug}/` : `/writing/topics/${slug}/`);

export const postPath = (direction: DirectionId, post: SamplePost) =>
  prototypeAddress(direction, proposedAddress(direction, post));

// Directions ----------------------------------------------------------------

export const directions: DesignDirection[] = [
  {
    id: "a",
    name: "Front page",
    summary:
      "A magazine front page. The newest post is a large lead story, Don's featured posts sit in a bento grid beneath it, and a card grid of recent posts follows. Topics are colour-coded pills on every card.",
    topicPresentation:
      "Colour-coded pills on every card and a pill row under the landing heading. A topic page opens with an introduction banner in the topic's colour, followed by a card grid.",
    addresses: {
      post: "/writing/{slug}/",
      landing: "/writing/",
      all: "/writing/all/",
      allPage: "/writing/all/{n}/",
      topic: "/writing/topics/{topic}/",
    },
    newColoursOrFonts: [],
    noFeaturedBehaviour: "The bento grid is omitted and the lead story is the newest post.",
  },
  {
    id: "b",
    name: "Timeline",
    summary:
      "A reading log. One newest-first stream on a vertical timeline, grouped by month and mostly text. A short Start here list pinned above the stream carries the featured posts.",
    topicPresentation:
      "Plain text topic links in a filter row above the stream. A topic page is an introduction paragraph followed by the same timeline, filtered to that topic.",
    addresses: {
      post: "/writing/{slug}/",
      landing: "/writing/",
      all: "/writing/all/",
      allPage: "/writing/all/{n}/",
      topic: "/writing/topics/{topic}/",
    },
    newColoursOrFonts: [],
    noFeaturedBehaviour: "The Start here list is omitted and the stream begins with the newest post.",
  },
  {
    id: "c",
    name: "Topic hubs",
    summary:
      "A field guide. The writing is organised around the four topics. Each topic is a hub with its introduction, its featured post and its newest posts, with a strip of the three newest posts above them.",
    topicPresentation:
      "Topics are the main structure. The listing has a side index of topics (a disclosure on phones), and each topic hub shows its introduction, featured post and every post in it.",
    addresses: {
      post: "/writing/{year}/{slug}/",
      landing: "/writing/",
      all: "/writing/all/",
      allPage: "/writing/all/{n}/",
      topic: "/writing/{topic}/",
    },
    newColoursOrFonts: [],
    noFeaturedBehaviour: "Each topic hub leads with its newest post instead of a featured one.",
  },
];

export function directionById(id: DirectionId): DesignDirection {
  return directions.find((d) => d.id === id)!;
}
