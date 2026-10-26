// How a project status is shown (data-model.md "Derived: status presentation"). The word in
// the pill carries the status; the tone is decoration. The statuses themselves are in
// src/content/collections/project-rules.ts.
import type { ProjectStatus } from "../../content/collections/project-rules.ts";

const labels: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  experiment: "Experiment",
  "in-progress": "In progress",
  retired: "Retired",
};

const tones = { shipped: "sage", experiment: "lavender", "in-progress": "rust", retired: "mauve" } as const;

export function statusLabel(status: ProjectStatus): string {
  return labels[status];
}

export function statusTone(status: ProjectStatus): (typeof tones)[ProjectStatus] {
  return tones[status];
}
