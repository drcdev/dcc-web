// The single place for the questions API's limits and model (FR-018, data-model section 4).
// `MAX_INPUT_CHARS` is also imported by the build-side question source preparer.
// The migration's CHECK constraints mirror QUESTIONS_MIN and QUESTIONS_MAX.

/** Workers AI text-generation model that writes the questions. */
export const QUESTIONS_MODEL = "@cf/meta/llama-3.2-3b-instruct";

/** Site-wide token bucket per environment: the most generations in a burst, and the refill per day. */
export const BUCKET_CAPACITY = 200;
export const BUCKET_REFILL_PER_DAY = 200;

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
