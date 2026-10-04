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

  it("names the Granite model", () => {
    expect(config.QUESTIONS_MODEL).toBe("@cf/ibm-granite/granite-4.0-h-micro");
  });
});
