// Shared helpers for per-item check implementations (scripts/setup-check/checks/*.ts).
// Keeps CheckResult construction, step/docs labelling and provider-error mapping
// consistent across items, per data-model.md "CheckResult" and FR-027/FR-028/FR-030.
import { ProviderAccessError } from "../types.ts";
import { redact } from "../redact.ts";
import { setupItems } from "../items.ts";
import type { CheckResult } from "../types.ts";

// The item count comes from the registry, so adding an item never leaves a stale "of N" label.
// items.ts imports the checks, which import this module; the registry is only read when a label
// is built (long after both modules have loaded), so the import cycle is safe.
export function stepLabel(order: number): string {
  return `Step ${order} of ${setupItems.length}`;
}

export function docsLink(id: string): string {
  return `docs/setup.md#${id}`;
}

export interface ItemLabel {
  id: string;
  order: number;
}

export function complete(item: ItemLabel, summary: string, details: string[] = []): CheckResult {
  return {
    id: item.id,
    status: "complete",
    summary,
    details,
    nextAction: null,
    step: stepLabel(item.order),
    docs: docsLink(item.id),
    reason: null,
  };
}

export function missing(
  item: ItemLabel,
  summary: string,
  nextAction: string,
  details: string[] = [],
): CheckResult {
  return {
    id: item.id,
    status: "missing",
    summary,
    details,
    nextAction,
    step: stepLabel(item.order),
    docs: docsLink(item.id),
    reason: null,
  };
}

export function pending(
  item: ItemLabel,
  summary: string,
  nextAction: string,
  details: string[] = [],
): CheckResult {
  return {
    id: item.id,
    status: "pending",
    summary,
    details,
    nextAction,
    step: stepLabel(item.order),
    docs: docsLink(item.id),
    reason: null,
  };
}

export function couldNotCheck(
  item: ItemLabel,
  summary: string,
  reason: string,
  nextAction: string,
  details: string[] = [],
): CheckResult {
  return {
    id: item.id,
    status: "could-not-check",
    summary,
    details,
    nextAction,
    step: stepLabel(item.order),
    docs: docsLink(item.id),
    reason,
  };
}

/** True when a caught error was thrown because the named credential is absent (never network/auth). */
export function isMissingCredentialReason(reason: string): boolean {
  return /not set in \.env/i.test(reason);
}

/**
 * Maps a thrown ProviderAccessError (or any other error) to a could-not-check
 * CheckResult, redacting the message first (defence in depth; providers
 * already redact known secret values before throwing). Re-throws anything
 * that is not an Error so a genuine bug is not swallowed as could-not-check.
 */
export function fromProviderError(item: ItemLabel, summary: string, err: unknown, nextAction: string): CheckResult {
  if (err instanceof ProviderAccessError) {
    return couldNotCheck(item, summary, redact(err.reason), nextAction);
  }
  if (err instanceof Error) {
    return couldNotCheck(item, summary, redact(err.message), nextAction);
  }
  throw err;
}

/** Required .env names missing from the given list, in the order given. */
export function missingEnvNames(names: string[], has: (name: string) => boolean): string[] {
  return names.filter((name) => !has(name));
}

/**
 * Normalises TXT record content for comparison across providers. A TXT value longer than 255
 * characters is stored as multiple character-strings; Cloudflare's API returns these as
 * space-separated quoted chunks (e.g. `"k=rsa; p=AAAA" "BBBB"`), while public DNS (Node's
 * resolver, via providers/dns.ts) and the baseline join the chunks with no separator. Every DNS
 * comparison that touches TXT content (dns-records-parity, mail-records, ...) must use this
 * so both sides normalise to the same canonical, joined form. Splits into quoted chunks when
 * quotes are present and concatenates them with no separator; an unquoted value is used as-is
 * after trimming, so a single chunk's own spaces (e.g. an SPF string) are preserved.
 */
export function normalizeTxtContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.includes('"')) {
    return trimmed;
  }
  const chunks = [...trimmed.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  if (chunks.length === 0) {
    return trimmed.replace(/^"|"$/g, "");
  }
  return chunks.join("");
}
