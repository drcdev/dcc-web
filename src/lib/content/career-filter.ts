// The career timeline filter's pure logic (specs/041-career-timeline US3). The client script in
// CareerTimeline.astro reads each step's categories from the page and applies the plan returned
// here; nothing in this file touches the DOM.
import { categoryIds, type CategoryId } from "./career.ts";

/** The choice in the filter: one category, or everything. */
export type Choice = CategoryId | "all";

/** What the filter needs to know about a step. */
export interface FilterStep {
  id: string;
  categories: readonly CategoryId[];
}

/** What to do to one step after a filter change. */
export interface StepState {
  id: string;
  open: boolean;
  muted: boolean;
  match: boolean;
}

export interface Plan {
  choice: Choice;
  status: string;
  steps: StepState[];
}

/** The categories at least one step uses, in the fixed order. */
export function usedCategories(steps: readonly FilterStep[]): CategoryId[] {
  return categoryIds.filter((id) => steps.some((step) => step.categories.includes(id)));
}

/** Ids of the steps holding at least one item of the category (counted in steps, never items). */
export function matchingSteps(steps: readonly FilterStep[], category: CategoryId): string[] {
  return steps.filter((step) => step.categories.includes(category)).map((step) => step.id);
}

/** The category as the status line names it: the awards category reads "recognition". */
const statusWords: Record<"leadership" | "awards", string> = { leadership: "leadership", awards: "recognition" };

/** The polite status message (FR-013). */
export function statusText(choice: Choice, matching: number, total: number): string {
  if (choice === "all") return `Showing all ${total} roles.`;
  if (choice === "volunteer") return matching === 1 ? `1 of ${total} roles is a volunteer role.` : `${matching} of ${total} roles are volunteer roles.`;
  return `${matching} of ${total} ${matching === 1 ? "roles has" : "roles have"} ${statusWords[choice]}.`;
}

/**
 * The fresh plan for a filter change, for every step whatever the visitor did by hand (FR-012a).
 * `null` when the choice is already selected: nothing changes and nothing is announced.
 */
export function applyChoice(current: Choice, next: Choice, steps: readonly FilterStep[]): Plan | null {
  if (current === next) return null;
  const matching = next === "all" ? [] : matchingSteps(steps, next);
  return {
    choice: next,
    status: statusText(next, matching.length, steps.length),
    steps: steps.map((step) => {
      if (next === "all") return { id: step.id, open: false, muted: false, match: false };
      const match = matching.includes(step.id);
      return { id: step.id, open: match, muted: !match, match };
    }),
  };
}
