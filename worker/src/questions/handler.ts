// POST /api/questions (specs/022 contracts/questions-api.md). Generates questions only for a
// post the build published, reading its text from the build's own source file, never from the
// caller (FR-014). Answers carry no provider, model or prompt detail (FR-015).
import type { QuestionSource } from "../../../src/lib/questions/source.ts";
import { json, parseJsonObject, readCapped } from "../http";
import { isSameOriginRequest } from "../same-origin";
import { getSet, storeSet } from "./cache";
import { takeToken, refundToken } from "./bucket";
import { BODY_MAX_BYTES, FRESH_RESERVE, QUESTIONS_MODEL } from "./config";
import { generate } from "./generate";
import { logOutcome, type QuestionsOutcome } from "./log";
import { validateQuestions } from "./validate";

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const HASH = /^[0-9a-f]{64}$/;

const fail = (status: number, error: string, outcome: QuestionsOutcome, headers: Record<string, string> = {}, cause?: unknown) => {
  logOutcome(outcome, cause);
  return json({ ok: false, error }, status, headers);
};
const success = (source: "cached" | "generated" | "fresh", questions: string[]) => {
  logOutcome(source);
  return json({ ok: true, source, questions });
};

const isSource = (value: unknown): value is Pick<QuestionSource, "title" | "summary" | "text" | "hash"> => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["title", "summary", "text", "hash"].every((key) => typeof record[key] === "string");
};

export async function handleQuestions(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return fail(405, "method_not_allowed", "invalid", { Allow: "POST" });
  if (!isSameOriginRequest(request, new URL(request.url))) return fail(403, "forbidden", "forbidden");
  const contentType = (request.headers.get("Content-Type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (contentType !== "application/json") return fail(415, "unsupported_media_type", "invalid");

  const raw = await readCapped(request, BODY_MAX_BYTES);
  if (raw === null) return fail(413, "too_large", "invalid");
  const parsed = parseJsonObject(raw);
  if (parsed === null) return fail(400, "invalid", "invalid");
  const { slug, hash, fresh = false } = parsed;
  if (typeof slug !== "string" || slug.length < 1 || slug.length > 200 || !SLUG.test(slug)) return fail(400, "invalid", "invalid");
  if (typeof hash !== "string" || !HASH.test(hash)) return fail(400, "invalid", "invalid");
  if (typeof fresh !== "boolean") return fail(400, "invalid", "invalid");

  let taken = false;
  try {
    if (!fresh) {
      const cached = await getSet(env.DB, slug, hash);
      if (cached) return success("cached", cached);
    }

    const asset = await env.ASSETS.fetch(new Request(new URL(`/writing/${slug}/question-source.json`, request.url)));
    if (asset.status !== 200) return fail(404, "not_found", "not_found");
    const file: unknown = await asset.json();
    if (!isSource(file)) throw new Error("question source has the wrong shape");
    if (file.hash !== hash) return fail(404, "stale", "stale");

    // One site-wide token per generation, taken after the cheap checks and before the model call
    // (contract step 7). Every failure from here on gives it back.
    const take = await takeToken(env.DB, Date.now(), undefined, fresh ? FRESH_RESERVE : 0);
    if (!take.ok) {
      logOutcome("limited");
      return json({ ok: false, error: "limited", retryAfter: take.retryAfter }, 429, {
        "Retry-After": String(take.retryAfter),
      });
    }
    taken = true;

    const output = await generate(env.AI, file, fresh);
    const result = validateQuestions(output, file.text);
    if (!result.ok) {
      await refundToken(env.DB);
      return fail(503, "unavailable", "malformed");
    }

    if (fresh) return success("fresh", result.questions);
    await storeSet(env.DB, slug, hash, result.questions, QUESTIONS_MODEL);
    return success("generated", result.questions);
  } catch (error) {
    if (taken) await refundToken(env.DB);
    return fail(503, "unavailable", "unavailable", {}, error);
  }
}
