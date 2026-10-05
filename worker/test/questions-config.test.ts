import { describe, expect, it } from "vitest";
import * as config from "../src/questions/config";

const NUMERIC = [
  "BUCKET_CAPACITY",
  "BUCKET_REFILL_PER_DAY",
  "MAX_INPUT_CHARS",
  "MAX_OUTPUT_TOKENS",
  "MODEL_TIMEOUT_MS",
  "QUESTIONS_MIN",
  "QUESTIONS_MAX",
  "QUESTION_MAX_WORDS",
  "QUESTION_MAX_CHARS",
  "QUOTE_RUN_WORDS",
  "BODY_MAX_BYTES",
  "FRESH_RESERVE",
  "WORST_CASE_NEURONS",
  "FREE_NEURONS_PER_DAY",
] as const;

describe("questions config", () => {
  for (const name of NUMERIC) {
    it(`${name} is a positive finite number`, () => {
      const value = (config as Record<string, unknown>)[name];
      expect(typeof value).toBe("number");
      expect(Number.isFinite(value)).toBe(true);
      expect(value as number).toBeGreaterThan(0);
    });
  }

  it("QUESTIONS_MIN is at most QUESTIONS_MAX", () => {
    expect(config.QUESTIONS_MIN).toBeLessThanOrEqual(config.QUESTIONS_MAX);
  });

  it("both environments' worst day (capacity plus a day's refill, at the worst-case neurons) fits the free allocation", () => {
    const perEnvironment = (config.BUCKET_CAPACITY + config.BUCKET_REFILL_PER_DAY) * config.WORST_CASE_NEURONS;
    expect(2 * perEnvironment).toBeLessThanOrEqual(config.FREE_NEURONS_PER_DAY);
  });

  it("FRESH_RESERVE is below BUCKET_CAPACITY so New questions is not disabled outright", () => {
    expect(config.FRESH_RESERVE).toBeLessThan(config.BUCKET_CAPACITY);
  });

  it("names the Llama 3.2 3B instruct model", () => {
    expect(config.QUESTIONS_MODEL).toBe("@cf/meta/llama-3.2-3b-instruct");
  });
});
