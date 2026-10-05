// POST /api/questions (specs/022 contracts/questions-api.md). Generates questions only for a
// post the build published, reading its text from the build's own source file, never from the
// caller (FR-014). Answers carry no provider, model or prompt detail (FR-015).
import { json } from "../http";
import { isSameOriginRequest } from "../same-origin";
import { getSet, storeSet } from "./cache";
import { takeToken, refundToken } from "./bucket";
import { BODY_MAX_BYTES, QUESTIONS_MODEL } from "./config";
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

/** Reads the body through a byte counter; null when it grows past the cap. */
async function readCapped(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > BODY_MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

interface SourceFile {
  title: string;
  summary: string;
  text: string;
  hash: string;
}

const isSource = (value: unknown): value is SourceFile => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["title", "summary", "text", "hash"].every((key) => typeof record[key] === "string");
};

export async function handleQuestions(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return fail(405, "method_not_allowed", "invalid", { Allow: "POST" });
  if (!isSameOriginRequest(request, new URL(request.url))) return fail(403, "forbidden", "forbidden");
  const contentType = (request.headers.get("Content-Type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (contentType !== "application/json") return fail(415, "unsupported_media_type", "invalid");

  const raw = await readCapped(request);
  if (raw === null) return fail(413, "too_large", "invalid");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail(400, "invalid", "invalid");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return fail(400, "invalid", "invalid");
  const { slug, hash, fresh = false } = parsed as Record<string, unknown>;
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
    const take = await takeToken(env.DB, Date.now());
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
