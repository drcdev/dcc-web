// Unit tests (primary layer: unit) for the project status module: the four statuses, their labels and
// pill tones (data-model.md "Derived: status presentation"; FR-001, FR-004).
import { describe, expect, it } from "vitest";
import { projectStatuses, statusLabel, statusTone } from "../../../src/lib/content/project-status.ts";

describe("project status", () => {
  it("lists the four statuses", () => {
    expect([...projectStatuses]).toEqual(["shipped", "experiment", "in-progress", "retired"]);
  });

  it.each([
    ["shipped", "Shipped", "sage"],
    ["experiment", "Experiment", "lavender"],
    ["in-progress", "In progress", "rust"],
    ["retired", "Retired", "mauve"],
  ] as const)("%s reads %s in the %s tone", (status, label, tone) => {
    expect(statusLabel(status)).toBe(label);
    expect(statusTone(status)).toBe(tone);
  });
});
