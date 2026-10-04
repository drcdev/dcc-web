// Project status and how it is shown (data-model.md "Derived: status presentation"). The word in
// the pill carries the status; the tone is decoration.
export const projectStatuses = ["shipped", "experiment", "in-progress", "retired"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

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
