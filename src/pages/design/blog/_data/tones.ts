// Whole class names per topic tone, so Tailwind can see them. Existing palettes only.
import type { Tone } from "./samples.ts";

export const toneBorder: Record<Tone, string> = {
  rust: "border-rust-700 dark:border-rust-300",
  sage: "border-sage-700 dark:border-sage-300",
  lavender: "border-lavender-700 dark:border-lavender-300",
  mist: "border-dusk-500 dark:border-mist-300",
};

export const toneBanner: Record<Tone, string> = {
  rust: "bg-rust-100 text-rust-900 dark:bg-rust-900 dark:text-rust-100",
  sage: "bg-sage-100 text-sage-900 dark:bg-sage-900 dark:text-sage-100",
  lavender: "bg-lavender-100 text-lavender-900 dark:bg-lavender-900 dark:text-lavender-100",
  mist: "bg-mist-200 text-dusk-900 dark:bg-dusk-700 dark:text-mist-100",
};
