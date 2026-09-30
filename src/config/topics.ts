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
    colour: "sage",
  },
  {
    id: "agentic-ai",
    name: "Agentic AI in legacy environments",
    description:
      "Putting AI agents to work next to systems that nobody wants to touch: where they help, where they get in the way and how to keep them safe.",
    colour: "lavender",
  },
  {
    id: "healthcare-leadership",
    name: "Healthcare technology leadership",
    description:
      "Leading technology in healthcare: working with clinicians, earning trust and delivering change in organisations that cannot stop.",
    colour: "mist",
  },
] as const satisfies readonly Topic[];

export type TopicId = (typeof topics)[number]["id"];

/** Every topic id in list order, as the non-empty tuple `z.enum()` needs. */
export const topicIds = topics.map((topic) => topic.id) as unknown as readonly [TopicId, ...TopicId[]];

/** The topic with this id, or undefined. */
export function findTopic(id: string): (typeof topics)[number] | undefined {
  return topics.find((topic) => topic.id === id);
}
