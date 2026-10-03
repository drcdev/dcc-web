// The checked Options table of a project story (data-model.md "OptionsComparison"). Produced by
// validateProjectStory from the Markdown table, never written as data, and passed to the page through
// `Astro.locals.project.comparison`.

export type Fit = "yes" | "partly" | "no";

export interface OptionsConstraint {
  /** Equals the bold label of the matching list item. */
  label: string;
}

export interface OptionsOption {
  /** Text of the first cell, bold markers removed. */
  name: string;
  /** The first cell is entirely one strong node. */
  chosen: boolean;
  /** One answer per constraint, lower-cased. */
  fits: Fit[];
}

export interface OptionsComparison {
  /** The table's first header cell text. */
  optionHeader: string;
  constraints: OptionsConstraint[];
  options: OptionsOption[];
}
