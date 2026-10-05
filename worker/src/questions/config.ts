// The single place for the questions API's limits and model (FR-018, data-model section 4).
// `MAX_INPUT_CHARS` is also imported by the build-side question source preparer.
// The migration's CHECK constraints mirror QUESTIONS_MIN and QUESTIONS_MAX.

/** Workers AI text-generation model that writes the questions. */
export const QUESTIONS_MODEL = "@cf/meta/llama-3.2-3b-instruct";

/**
 * Site-wide token bucket per environment: the most generations in a burst, and the refill per day.
 * Sizing rule: the free allocation resets daily but the bucket refills continuously, so in one day an
 * environment can spend a full bucket plus a day's refill. Production and preview share the account's
 * allocation, so 2 x (BUCKET_CAPACITY + BUCKET_REFILL_PER_DAY) x WORST_CASE_NEURONS must stay at or
 * below FREE_NEURONS_PER_DAY (a config test asserts it).
 */
export const BUCKET_CAPACITY = 60;
export const BUCKET_REFILL_PER_DAY = 60;
/** Neurons one generation costs at most with Llama 3.2 3B (24,000 input characters, 300 output tokens). */
export const WORST_CASE_NEURONS = 39;
/** Workers AI neurons the free plan allows each day, across the account. */
export const FREE_NEURONS_PER_DAY = 10_000;
/** Tokens a "New questions" (fresh) call leaves in the bucket, so it cannot drain it for first generations. */
export const FRESH_RESERVE = 20;

/** Longest post text sent to the model, in characters. */
export const MAX_INPUT_CHARS = 24_000;
/** Cap on model output tokens. */
export const MAX_OUTPUT_TOKENS = 300;
/** How long the Worker waits for the model, in milliseconds. */
export const MODEL_TIMEOUT_MS = 15_000;

/** How many valid questions a set holds. */
export const QUESTIONS_MIN = 2;
export const QUESTIONS_MAX = 4;
/** Limits for one question. */
export const QUESTION_MAX_WORDS = 25;
export const QUESTION_MAX_CHARS = 200;
/** A question sharing this many consecutive words with the post is rejected (no quoting at length). */
export const QUOTE_RUN_WORDS = 10;

/** Request body cap in bytes. */
export const BODY_MAX_BYTES = 1024;
