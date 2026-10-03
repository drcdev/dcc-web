// The four parts of a project story, in order (data-model.md "Part"). Defined once and used by the
// schema, the story check, the parts plugin and the components. Headings are not overridable per project.

export const partIds = ["problem", "options", "build", "lessons"] as const;

export type PartId = (typeof partIds)[number];

export const partHeadings: Record<PartId, string> = {
  problem: "Problem",
  options: "Options",
  build: "Build",
  lessons: "Lessons",
};
