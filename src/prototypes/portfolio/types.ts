// Types for the portfolio design-direction prototypes
// (specs/006-portfolio-design-directions/data-model.md). Prototype only; removed
// with the prototypes before merge.

export type ProjectStatus = "shipped" | "experiment" | "in-progress";

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  experiment: "Experiment",
  "in-progress": "In progress",
};

/** A plain label such as "AI integration" or "Mobile". */
export type Theme = string;

export type Visual =
  | { kind: "diagram"; id: "architecture" | "options"; label: string; description: string }
  | { kind: "placeholder"; media: "screenshot" | "clip"; label: string; description: string };

export interface ProjectEntry {
  slug: string;
  title: string;
  /** One sentence, at most 140 characters, ends with a full stop. */
  problem: string;
  visual: Visual;
  themes: Theme[];
  status: ProjectStatus;
  /** Set only for Focus Pocus; the direction prefixes it. */
  storyPath?: string;
  externalHref: string;
  reviewNote: string;
}

export const STAGE_ORDER = [
  "problem",
  "constraints",
  "options",
  "built",
  "outcome",
  "lessons",
  "invitation",
] as const;

export type StageId = (typeof STAGE_ORDER)[number];

export interface StoryStage {
  id: StageId;
  heading: string;
  /** Paragraphs; may be empty only for the invitation. */
  body: string[];
  visual?: Visual;
  draft: true;
}

export type ConstraintId = "macos-only" | "natural-dates" | "bulk-speed" | "mcp-model";

export interface Constraint {
  id: ConstraintId;
  label: string;
  detail: string;
}

export type Fit = "meets" | "partly" | "misses";

export interface StoryOption {
  id: string;
  name: string;
  summary: string;
  pros: string[];
  cons: string[];
  fit: Record<ConstraintId, Fit>;
  chosen: boolean;
  reason?: string;
}

export interface Demo {
  live: boolean;
  href: string;
  secondaryHref: string;
  standInNote: string;
  still: Visual;
}

export interface SampleStory {
  entry: ProjectEntry;
  stages: StoryStage[];
  constraints: Constraint[];
  options: StoryOption[];
  demo: Demo;
}

export interface Direction {
  key: "a" | "b" | "c";
  name: string;
  summary: string;
  indexPath: string;
  storyPath: string;
  behaviours: { stages: string; options: string; demo: string; reveals: string };
  dimensions: {
    storyLayout: string;
    stageMovement: string;
    optionPattern: string;
    indexStructure: string;
    revealStyle: string;
  };
  javascript: string[];
  newResources: string[];
}
