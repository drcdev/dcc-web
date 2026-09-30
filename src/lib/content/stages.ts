// The seven stages of a project story (data-model.md "Stage and Chapter").
// Headings are not overridable per project; change the wording here.

export const stageIds = [
  "problem",
  "constraints",
  "options",
  "built",
  "outcome",
  "lessons",
  "invitation",
] as const;

export type StageId = (typeof stageIds)[number];

export interface Stage {
  /** 1 to 7. */
  order: number;
  id: StageId;
  heading: string;
}

const headings: Record<StageId, string> = {
  problem: "The problem",
  constraints: "What made it hard",
  options: "Options considered",
  built: "What I built",
  outcome: "How it turned out",
  lessons: "What I'd do differently",
  invitation: "Have a problem like this?",
};

export const stages: readonly Stage[] = stageIds.map((id, index) => ({
  order: index + 1,
  id,
  heading: headings[id],
}));
