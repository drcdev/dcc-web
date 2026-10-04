// Parses and validates the model's output (data-model section 5, FR-003, FR-004, SC-002).
// Pure: no I/O, no logging. Only 2 to 4 plain question sentences ever leave this module.
import {
  QUESTION_MAX_CHARS,
  QUESTION_MAX_WORDS,
  QUESTIONS_MAX,
  QUESTIONS_MIN,
  QUOTE_RUN_WORDS,
} from "./config";

export type ValidationResult = { ok: true; questions: string[] } | { ok: false; reason: "malformed" };

const LIST_MARKER = /^\s*(?:\d+[.)]|[-*•])\s+/;
const URL_LIKE = /https?:\/\/|www\./i;

/** Strips a list marker, surrounding quotes and Markdown emphasis from one line. */
function clean(line: string): string {
  let text = line.replace(LIST_MARKER, "").trim();
  text = text.replace(/(\*\*|__|\*|_)(.+?)\1/g, "$2");
  text = text.replace(/^["'“‘]+|["'”’]+$/g, "");
  return text.trim();
}

/** Lowercase words with punctuation removed, for comparing runs of words. */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** True when `question` shares a run of `QUOTE_RUN_WORDS` consecutive words with the source. */
function quotesSource(question: string, sourceRuns: Set<string>): boolean {
  const own = words(question);
  for (let i = 0; i + QUOTE_RUN_WORDS <= own.length; i += 1) {
    if (sourceRuns.has(own.slice(i, i + QUOTE_RUN_WORDS).join(" "))) return true;
  }
  return false;
}

function runsOf(text: string): Set<string> {
  const all = words(text);
  const runs = new Set<string>();
  for (let i = 0; i + QUOTE_RUN_WORDS <= all.length; i += 1) runs.add(all.slice(i, i + QUOTE_RUN_WORDS).join(" "));
  return runs;
}

function isValid(question: string, sourceRuns: Set<string>): boolean {
  if (!question.endsWith("?")) return false;
  // No sentence end before the final question mark.
  if (/[.!?]/.test(question.slice(0, -1))) return false;
  if (question.length > QUESTION_MAX_CHARS) return false;
  const count = question.split(/\s+/).filter(Boolean).length;
  if (count < 1 || count > QUESTION_MAX_WORDS) return false;
  if (/[<>`]/.test(question) || URL_LIKE.test(question)) return false;
  return !quotesSource(question, sourceRuns);
}

/** Keeps the first valid questions (at most QUESTIONS_MAX); fewer than QUESTIONS_MIN is `malformed`. */
export function validateQuestions(raw: string, sourceText: string): ValidationResult {
  const sourceRuns = runsOf(sourceText);
  const seen = new Set<string>();
  const questions: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const question = clean(line);
    if (!question || !isValid(question, sourceRuns)) continue;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(question);
    if (questions.length === QUESTIONS_MAX) break;
  }
  return questions.length >= QUESTIONS_MIN ? { ok: true, questions } : { ok: false, reason: "malformed" };
}
