// checks/live-domain-ghost.ts (setup item 6, "Live domain: Ghost or switched"; 011-launch
// contracts/setup-items.md, FR-010, FR-010b, FR-038). The launch phase comes from Cloudflare's
// Custom Domain list, never from DNS answers, so a deliberate switch is told apart from an
// accident. Switched: complete. Before the switch: public A/AAAA/CNAME answers for the apex and
// www must equal the Ghost target records in the baseline; any difference is `missing` with a
// summary starting "Problem:". The apex and www are reported separately so a half-switched domain
// is visible. Mail records are compared by item 32, not here. The Ghost generator marker is an
// informational detail only and never decides the status.
import type { CheckResult, DnsAnswer, DnsBaseline, DnsBaselineRecord, DnsRecordType, ProviderContext, SetupConfig } from "../types.ts";
import { detectLaunchPhase } from "./launch-phase.ts";
import type { LaunchPhase } from "./launch-phase.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "live-domain-ghost", order: 6 };
const APEX_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME"];

function normName(name: string): string {
  return name.toLowerCase().replace(/\.$/, "");
}

function normContent(type: DnsRecordType, content: string): string {
  const value = content.trim();
  return type === "CNAME" ? value.replace(/\.$/, "").toLowerCase() : value;
}

interface RecordGroup {
  name: string;
  type: DnsRecordType;
  records: DnsBaselineRecord[];
}

function groupByNameAndType(records: DnsBaselineRecord[]): RecordGroup[] {
  const map = new Map<string, RecordGroup>();
  for (const record of records) {
    const key = `${record.type}:${normName(record.name)}`;
    const group = map.get(key) ?? { name: record.name, type: record.type, records: [] };
    group.records.push(record);
    map.set(key, group);
  }
  return [...map.values()];
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

function actualSet(type: DnsRecordType, answers: DnsAnswer[]): Set<string> {
  return new Set(answers.map((a) => normContent(type, a.value)));
}

/** One line per half (`apex: …`, `www: …`) saying whether it still resolves to the recorded Ghost targets. */
async function compareHalves(
  ctx: ProviderContext,
  halves: Array<{ label: "apex" | "www"; groups: RecordGroup[] }>,
): Promise<{ lines: string[]; differing: number }> {
  const lines: string[] = [];
  let differing = 0;
  for (const half of halves) {
    const differences: string[] = [];
    for (const group of half.groups) {
      const expected = new Set(group.records.map((r) => normContent(group.type, r.content)));
      const actual = actualSet(group.type, await ctx.dns.resolve(group.name, group.type));
      if (!setsEqual(expected, actual)) {
        differences.push(
          `${group.type} ${group.name}: expected ${[...expected].join(", ")}, found ${[...actual].join(", ") || "(none)"}`,
        );
      }
    }
    if (differences.length > 0) {
      differing += 1;
      lines.push(`${half.label}: differs from the Ghost baseline (${differences.join("; ")})`);
    } else {
      lines.push(`${half.label}: still resolves to the Ghost baseline`);
    }
  }
  return { lines, differing };
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  let phase: LaunchPhase;
  try {
    phase = await detectLaunchPhase(ctx);
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not tell whether the domain has switched, so the live domain cannot be judged.",
      err,
      "Check CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env are set and valid, then try again.",
    );
  }

  const baseline = ctx.fs.readJson<DnsBaseline>("setup/dns-baseline.json") ?? { originalNameservers: [], records: [] };
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const zone = config?.zone ?? "doncoleman.ca";
  const workerName = config?.workerName ?? "dcc-web";
  const wwwName = `www.${zone}`;

  const ghostRecords = baseline.records.filter(
    (r) => r.decision === "keep" && APEX_TYPES.includes(r.type) && [normName(zone), normName(wwwName)].includes(normName(r.name)),
  );
  const halves = (["apex", "www"] as const)
    .map((label) => ({
      label,
      groups: groupByNameAndType(ghostRecords.filter((r) => normName(r.name) === normName(label === "apex" ? zone : wwwName))),
    }))
    .filter((half) => half.groups.length > 0);

  if (phase === "switched") {
    let details: string[] = [];
    try {
      details = (await compareHalves(ctx, halves)).lines;
    } catch {
      // The switch is deliberate, so a failed DNS read only costs the informational detail.
    }
    return complete(
      ITEM,
      `Switched to the new site on purpose (Custom Domain ${zone} on ${workerName}); the Ghost comparison applies again only during a rollback.`,
      details,
    );
  }

  if (ghostRecords.length === 0) {
    return missing(
      ITEM,
      "No Ghost baseline records are recorded yet for the apex or www.",
      "Record the Squarespace baseline first (step 4), including the current A/AAAA/CNAME records for the apex and www.",
    );
  }

  let comparison: { lines: string[]; differing: number };
  try {
    comparison = await compareHalves(ctx, halves);
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not resolve public DNS for the live domain.",
      err,
      "Check public DNS is reachable, then try again.",
    );
  }

  if (comparison.differing > 0) {
    return missing(
      ITEM,
      "Problem: the live domain does not match the recorded Ghost baseline.",
      "Restore the Ghost DNS records from the recorded baseline in Cloudflare straight away; if it cannot be fixed within minutes, follow the rollback in docs/launch.md#rollback.",
      comparison.lines,
    );
  }

  const details = [...comparison.lines];
  const marker = config?.ghostMarker;
  if (marker) {
    try {
      const response = await ctx.http.get(`https://${zone}/`);
      if (response.body.includes(marker)) {
        details.push(`The served page includes the Ghost marker "${marker}" (informational only).`);
      }
    } catch {
      // Informational only (FR-038): a failed probe never affects status.
    }
  }

  return complete(ITEM, "The live domain still resolves to the recorded Ghost targets.", details);
}
