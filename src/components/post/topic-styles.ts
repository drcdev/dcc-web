// Tailwind needs whole class names in source, so the pill, border and banner
// classes for each palette live in one static map, keyed by a topic's `colour`
// (research R2). Only existing palette tokens are used (no new colours). Every
// text and background pair is at least 4.5:1 in both themes; the unit test
// tests/unit/content/topics.test.ts computes that from the tokens in
// src/styles/global.css (FR-017).
import type { Palette } from "../../config/topics.ts";

export interface TopicStyle {
  /** Topic pill link: background and text, light and dark. */
  pill: string;
  /** Decorative border of a card with no image, in the topic's colour. */
  border: string;
  /** Introduction banner of the topic page: background and text, light and dark. */
  banner: string;
}

// The transparent border is invisible normally and shows in forced-colours mode, where the
// background is removed and the pill would otherwise read as plain link text (FR-051).
const pillBase =
  "inline-block rounded-full border border-transparent px-3 py-1 text-sm font-medium no-underline hover:underline";

export const topicStyles: Partial<Record<Palette, TopicStyle>> = {
  rust: {
    pill: `${pillBase} bg-rust-100 text-rust-900 dark:bg-rust-900 dark:text-rust-100`,
    border: "border-rust-500 dark:border-rust-400",
    banner: "bg-rust-100 text-rust-950 dark:bg-rust-900 dark:text-rust-50",
  },
  sage: {
    pill: `${pillBase} bg-sage-100 text-sage-900 dark:bg-sage-900 dark:text-sage-100`,
    border: "border-sage-600 dark:border-sage-400",
    banner: "bg-sage-100 text-sage-950 dark:bg-sage-900 dark:text-sage-50",
  },
  lavender: {
    pill: `${pillBase} bg-lavender-100 text-lavender-900 dark:bg-lavender-900 dark:text-lavender-100`,
    border: "border-lavender-500 dark:border-lavender-400",
    banner: "bg-lavender-100 text-lavender-950 dark:bg-lavender-900 dark:text-lavender-50",
  },
  mist: {
    pill: `${pillBase} bg-mist-200 text-mist-900 dark:bg-mist-900 dark:text-mist-100`,
    border: "border-mist-600 dark:border-mist-400",
    banner: "bg-mist-200 text-mist-950 dark:bg-mist-900 dark:text-mist-50",
  },
};

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
