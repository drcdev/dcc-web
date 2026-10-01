// Shared helpers for the post-launch items 28 to 32 (011-launch contracts/setup-items.md):
// the launch-phase gate, the 24-hour sentence every pending result ends with (FR-017), the
// "DNS is still settling" reading (research R7) and the TLS-error test.
import { ProviderAccessError } from "../types.ts";
import type { CheckResult, DnsBaseline, DnsRecordType, ProviderContext, SetupConfig } from "../types.ts";
import { detectLaunchPhase } from "./launch-phase.ts";
import { fromProviderError, pending, waiting } from "./shared.ts";
import type { ItemLabel } from "./shared.ts";

export const PENDING_24H =
  "If this is still pending 24 hours after the switch, treat it as a problem and see docs/launch.md#rollback.";

const ADDRESS_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME"];

/** A pending result whose `nextAction` ends with the fixed 24-hour sentence. */
export function pendingLive(item: ItemLabel, summary: string, lead: string, details: string[] = []): CheckResult {
  return pending(item, summary, `${lead} ${PENDING_24H}`, details);
}

export function isTlsError(err: unknown): boolean {
  return err instanceof ProviderAccessError && err.kind === "tls";
}

export interface LiveSetup {
  config: SetupConfig | null;
  zone: string;
}

/**
 * Reads the launch phase. Returns a result to hand straight back (could-not-check when the phase
 * cannot be read, waiting before the switch), or the setup once the phase is `switched`.
 */
export async function gateOnSwitch(
  ctx: ProviderContext,
  item: ItemLabel,
  waitingSummary: string,
  couldNotSummary: string,
): Promise<{ result: CheckResult } | { setup: LiveSetup }> {
  try {
    if ((await detectLaunchPhase(ctx)) === "before-switch") return { result: waiting(item, waitingSummary) };
  } catch (err) {
    return {
      result: fromProviderError(
        item,
        couldNotSummary,
        err,
        "Check CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env are set and valid, then try again.",
      ),
    };
  }
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  return { setup: { config, zone: config?.zone ?? "doncoleman.ca" } };
}

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * True while public DNS for `name` has not settled: a resolver still returns a Ghost web target
 * from the baseline, or a resolver has no address answer yet. Proxied
 * Cloudflare addresses legitimately differ between resolvers, so differing addresses alone are not
 * "settling".
 */
export async function dnsSettling(ctx: ProviderContext, name: string): Promise<string[]> {
  const baseline = ctx.fs.readJson<DnsBaseline>("setup/dns-baseline.json");
  const ghostTargets = new Set(
    (baseline?.records ?? [])
      .filter((r) => r.decision === "keep" && ADDRESS_TYPES.includes(r.type) && norm(r.name) === norm(name))
      .map((r) => norm(r.content)),
  );

  const perResolver = new Map<string, { hasAnswer: boolean; ghost: string[] }>();
  for (const type of ADDRESS_TYPES) {
    for (const { resolver, answers } of await ctx.dns.resolveEach(name, type)) {
      const entry = perResolver.get(resolver) ?? { hasAnswer: false, ghost: [] };
      for (const answer of answers) {
        entry.hasAnswer = true;
        if (ghostTargets.has(norm(answer.value))) entry.ghost.push(`${answer.type} ${answer.value}`);
      }
      perResolver.set(resolver, entry);
    }
  }

  const reasons: string[] = [];
  for (const [resolver, entry] of perResolver) {
    for (const ghost of entry.ghost) reasons.push(`${resolver} still returns the Ghost target ${ghost} for ${name}`);
    if (!entry.hasAnswer) reasons.push(`${resolver} has no answer for ${name} yet`);
  }
  return reasons;
}
