// The controlled list of post topics (data-model.md "Topic"; research R2;
// FR-016). A post names topics by `id`; the post schema accepts only these ids,
// so a typo or a removed topic fails the build. The id is the topic's address,
// /writing/topics/{id}/, so keep an id once a post uses it.
//
// To add a topic: add one entry below and, if its colour is not yet in
// src/components/post/topic-styles.ts, one entry there (the unit test fails
// until both exist). Colours are the site's existing palettes and are unique.

/** The palettes defined in src/styles/global.css. */
export type Palette = "rust" | "sage" | "lavender" | "mist" | "sand" | "mauve" | "dusk";

export interface Topic {
  /** Lower-case letters, digits and hyphens, at most 40 characters, unique. */
  id: string;
  /** Shown on pills and the topic banner. */
  name: string;
  /** One or two sentences for the topic banner. */
  description: string;
  colour: Palette;
  /** Present (true) only on the two series, which have their own address and a marker. */
  series?: true;
}

export const topics = [
  {
    id: "compliant-data",
    name: "High-compliance data and integration",
    description:
      "Moving and protecting data where the rules are strict: integration patterns, audit trails and the trade-offs that regulated systems force.",
    colour: "rust",
  },
  {
    id: "technology-teams",
    name: "High-performing technology teams",
    description:
      "What makes a technology team effective over years, not sprints: how they decide, how they hand work over and how they keep learning.",
    colour: "sand",
  },
  {
    id: "agentic-ai",
    name: "Agentic AI in legacy environments",
    description:
      "Putting AI agents to work next to systems that nobody wants to touch: where they help, where they get in the way and how to keep them safe.",
    colour: "mauve",
  },
  {
    id: "healthcare-leadership",
    name: "Healthcare technology leadership",
    description:
      "Leading technology in healthcare: working with clinicians, earning trust and delivering change in organisations that cannot stop.",
    colour: "mist",
  },
  {
    id: "drift",
    name: "Drift",
    description:
      "Writing about how systems, teams and plans move away from what was intended, and how to notice it early enough to act.",
    colour: "lavender",
    series: true,
  },
  {
    id: "convergence",
    name: "Convergence",
    description:
      "Writing about how people, practices and technology come together, and what it takes to make that happen on purpose.",
    colour: "sage",
    series: true,
  },
] as const satisfies readonly Topic[];

export type TopicId = (typeof topics)[number]["id"];

/** Every topic id in list order, as the non-empty tuple `z.enum()` needs. */
export const topicIds = topics.map((topic) => topic.id) as unknown as readonly [TopicId, ...TopicId[]];

/** The six controlled ids (alias of `topicIds`, named for the free-form topic rules). */
export const controlledIds = topicIds;

/** The ids of the topics that are series, in list order. */
export const seriesIds = topics.filter((topic) => "series" in topic).map((topic) => topic.id) as readonly TopicId[];

/** The controlled topics shown in the pill row: every one that is not a series (FR-006). */
export const pillRowTopics = topics.filter((topic) => !("series" in topic));

/** The address of a topic page: /writing/{id}/ for a series, /writing/topics/{id}/ for any other topic. */
export function topicHref(id: string): string {
  return seriesIds.includes(id as TopicId) ? `/writing/${id}/` : `/writing/topics/${id}/`;
}

/** The other series id, for the series banner's "Read {other}" link. */
export function otherSeries(id: string): TopicId {
  const other = seriesIds.find((seriesId) => seriesId !== id);
  if (!other) throw new Error(`No series other than "${id}".`);
  return other;
}

/** The topic with this id, or undefined. */
export function findTopic(id: string): (typeof topics)[number] | undefined {
  return topics.find((topic) => topic.id === id);
}
