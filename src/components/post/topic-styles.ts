// Tailwind needs whole class names in source, so the pill, border, banner and series-marker
// classes for each palette live in one static map, keyed by a topic's `colour` (research R2).
// Only existing palette tokens are used (no new colours; FR-010a). Every text and background
// pair is at least 4.5:1 in both themes, and the 2px series-marker outline is at least 3:1
// against its fill and the page surface; the unit test tests/unit/content/topics.test.ts
// computes both from the tokens in src/styles/global.css (FR-010, FR-016c, FR-017). The
// computed values are recorded in the feature's research notes. The neutral (dusk) pill's dark
// fill is the card's own colour (dusk-800), so it keeps a 1px dusk-400 edge in dark mode, at
// least 3:1 against the card and the page (issue #46).
import type { Palette } from "../../config/topics.ts";

export interface TopicStyle {
  /** Topic pill link: background and text, light and dark. */
  pill: string;
  /** Decorative border of a card with no image, in the topic's colour. */
  border: string;
  /** Introduction banner of the topic page: background and text, light and dark. */
  banner: string;
  /** Series marker link: semibold, 2px outline in shade 700 (light) or 300 (dark), fill and text. */
  marker: string;
  /** Edge of a series tile or banner: 1px shade 300 in dark mode, 1px system colour in forced colours; none in light. */
  outline: string;
}

// The transparent border is invisible normally and shows in forced-colours mode, where the
// background is removed and the pill would otherwise read as plain link text (FR-051).
const pillBase =
  "inline-block rounded-full border border-transparent px-3 py-1 text-sm font-medium no-underline hover:underline";

// The series marker is told apart from an ordinary pill without colour: semibold text and a 2px
// solid outline. In forced-colours mode the outline keeps its 2px width in the system text
// colour (FR-016c, FR-016d). Hover adds an underline only; no colour change, no transition.
const markerBase =
  "inline-block rounded-full border-2 border-solid px-3 py-1 text-sm font-semibold no-underline hover:underline forced-colors:border-[CanvasText]";

export const topicStyles: Partial<Record<Palette, TopicStyle>> = {
  rust: {
    pill: `${pillBase} bg-rust-100 text-rust-900 dark:bg-rust-900 dark:text-rust-100`,
    border: "border-rust-500 dark:border-rust-400",
    banner: "bg-rust-100 text-rust-950 dark:bg-rust-900 dark:text-rust-50",
    marker: `${markerBase} border-rust-700 dark:border-rust-300 bg-rust-100 text-rust-900 dark:bg-rust-900 dark:text-rust-100`,
    outline: "dark:border dark:border-rust-300 forced-colors:border forced-colors:border-[CanvasText]",
  },
  sage: {
    pill: `${pillBase} bg-sage-100 text-sage-900 dark:bg-sage-900 dark:text-sage-100`,
    border: "border-sage-600 dark:border-sage-400",
    banner: "bg-sage-100 text-sage-950 dark:bg-sage-900 dark:text-sage-50",
    marker: `${markerBase} border-sage-700 dark:border-sage-300 bg-sage-100 text-sage-900 dark:bg-sage-900 dark:text-sage-100`,
    outline: "dark:border dark:border-sage-300 forced-colors:border forced-colors:border-[CanvasText]",
  },
  lavender: {
    pill: `${pillBase} bg-lavender-100 text-lavender-900 dark:bg-lavender-900 dark:text-lavender-100`,
    border: "border-lavender-500 dark:border-lavender-400",
    banner: "bg-lavender-100 text-lavender-950 dark:bg-lavender-900 dark:text-lavender-50",
    marker: `${markerBase} border-lavender-700 dark:border-lavender-300 bg-lavender-100 text-lavender-900 dark:bg-lavender-900 dark:text-lavender-100`,
    outline: "dark:border dark:border-lavender-300 forced-colors:border forced-colors:border-[CanvasText]",
  },
  mist: {
    pill: `${pillBase} bg-mist-200 text-mist-900 dark:bg-mist-900 dark:text-mist-100`,
    border: "border-mist-600 dark:border-mist-400",
    banner: "bg-mist-200 text-mist-950 dark:bg-mist-900 dark:text-mist-50",
    marker: `${markerBase} border-mist-700 dark:border-mist-300 bg-mist-200 text-mist-900 dark:bg-mist-900 dark:text-mist-100`,
    outline: "dark:border dark:border-mist-300 forced-colors:border forced-colors:border-[CanvasText]",
  },
  mauve: {
    pill: `${pillBase} bg-mauve-100 text-mauve-900 dark:bg-mauve-900 dark:text-mauve-100`,
    border: "border-mauve-500 dark:border-mauve-400",
    banner: "bg-mauve-100 text-mauve-950 dark:bg-mauve-900 dark:text-mauve-50",
    marker: `${markerBase} border-mauve-700 dark:border-mauve-300 bg-mauve-100 text-mauve-900 dark:bg-mauve-900 dark:text-mauve-100`,
    outline: "dark:border dark:border-mauve-300 forced-colors:border forced-colors:border-[CanvasText]",
  },
  sand: {
    pill: `${pillBase} bg-sand-100 text-sand-900 dark:bg-sand-900 dark:text-sand-100`,
    border: "border-sand-600 dark:border-sand-400",
    banner: "bg-sand-100 text-sand-950 dark:bg-sand-900 dark:text-sand-50",
    marker: `${markerBase} border-sand-700 dark:border-sand-300 bg-sand-100 text-sand-900 dark:bg-sand-900 dark:text-sand-100`,
    outline: "dark:border dark:border-sand-300 forced-colors:border forced-colors:border-[CanvasText]",
  },
  // Free-form topics: a neutral pill and a plain banner (FR-010a).
  dusk: {
    pill: `${pillBase} bg-dusk-100 text-dusk-900 dark:border-dusk-400 dark:bg-dusk-800 dark:text-dusk-100`,
    border: "border-dusk-300 dark:border-dusk-500",
    banner: "bg-dusk-100 text-dusk-950 dark:bg-dusk-800 dark:text-dusk-50",
    marker: `${markerBase} border-dusk-700 dark:border-dusk-300 bg-dusk-100 text-dusk-900 dark:bg-dusk-800 dark:text-dusk-100`,
    outline: "dark:border dark:border-dusk-300 forced-colors:border forced-colors:border-[CanvasText]",
  },
};

/**
 * The edge of a card or lead story that has an image: 1px dusk-200 in light, 1px dusk-500 in dark
 * (3.16:1 against the page, dusk-BASE; the old dusk-700 was 1.64:1). Series outlines use shade 300
 * of the series colour, as the series marker does (at least 3:1, proven in topics.test.ts). Cards with no image keep
 * their 2px topic-coloured border (`border`).
 */
export const cardEdge = "border border-dusk-200 dark:border-dusk-500";

/** The "Featured" mark on a card or a post. */
export const featuredMark =
  "inline-block rounded border border-transparent px-2 py-0.5 text-xs font-semibold uppercase tracking-wide bg-accent-100 text-accent-900 dark:bg-accent-900 dark:text-accent-100";

/** The "Draft" label on a card (non-production builds only). */
export const draftLabel =
  "inline-block rounded border border-rust-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide bg-rust-50 text-dusk-900 dark:border-rust-400 dark:bg-dusk-900 dark:text-white";

/** The style for a topic colour; throws when topic-styles.ts has no entry (the unit test catches this first). */
export function topicStyle(colour: Palette): TopicStyle {
  const style = topicStyles[colour];
  if (!style) throw new Error(`src/components/post/topic-styles.ts has no entry for the colour "${colour}".`);
  return style;
}
