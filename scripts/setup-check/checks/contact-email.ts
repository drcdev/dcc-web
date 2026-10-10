// checks/contact-email.ts (setup item 17): Email Routing is set up for the contact form. Two
// read-only parts run in one pass, so one run shows every gap:
//   Destination address  the address in wrangler.jsonc `send_email[0].destination_address` exists in
//                        the account's Email Routing destination addresses with a verified timestamp.
//   Sending subdomain    public DNS answers MX for the sender's subdomain with Cloudflare's routing hosts
//                        and a TXT SPF record containing `include:_spf.mx.cloudflare.net`.
// The apex records are not re-checked here: item 5 (`mail-records`) fails if any apex iCloud record
// changes. Nothing here reads a secret value.
import type { CheckResult, ProviderContext } from "../types.ts";
import {
  isCheckResult,
  readEmailConfig,
  requireCloudflareAccess,
  wranglerUnreadable,
  type EmailConfig,
} from "./contact-shared.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-email", order: 17 };
const SUMMARY = "Could not read the contact email setup.";
const DOCS = "docs/setup.md#contact-email";
const ROUTING_HOST = /^route[123]\.mx\.cloudflare\.net$/i;
const SPF_INCLUDE = "include:_spf.mx.cloudflare.net";
const APEX_NOTE = "This does not re-check the apex: item 5 (mail-records) confirms the doncoleman.ca mail records are unchanged.";

interface PartResult {
  problems: string[];
  fix: string;
}

async function checkDestination(ctx: ProviderContext, accountId: string, config: EmailConfig): Promise<PartResult> {
  const addresses = await ctx.cloudflare.listEmailRoutingAddresses(accountId);
  const found = addresses.find((a) => a.email.toLowerCase() === config.destination.toLowerCase());
  const problems: string[] = [];
  if (!found) {
    problems.push(`${config.destination} is not added as a destination address.`);
  } else if (!found.verified) {
    problems.push(`${config.destination} is added, but waiting for the verification link in its mailbox to be opened.`);
  }
  return {
    problems,
    fix: `In Cloudflare dashboard → Email Routing → Destination addresses, add ${config.destination} and open the verification link sent to that mailbox (${DOCS}).`,
  };
}

async function checkSubdomain(ctx: ProviderContext, config: EmailConfig): Promise<PartResult> {
  const mx = await ctx.dns.resolve(config.subdomain, "MX");
  const txt = await ctx.dns.resolve(config.subdomain, "TXT");
  const hasRouting = mx.some((a) => ROUTING_HOST.test(a.value.trim().replace(/\.$/, "")));
  const hasSpf = txt.some((a) => a.value.includes(SPF_INCLUDE));
  const problems: string[] = [];
  if (!hasRouting) {
    problems.push(`Email Routing is not on for ${config.subdomain}: no MX records for Cloudflare's routing hosts (route1/2/3.mx.cloudflare.net).`);
  }
  if (!hasSpf) {
    problems.push(`${config.subdomain} has no SPF record containing ${SPF_INCLUDE}.`);
  }
  if (problems.length > 0) problems.push(APEX_NOTE);
  return {
    problems,
    fix: `In Cloudflare dashboard → Email Routing → Settings → Subdomains, add the subdomain (${config.subdomain.split(".")[0]}) and stop if the dashboard offers to change any record on doncoleman.ca itself, then wait for DNS to settle (${DOCS}).`,
  };
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;
  if (ctx.fs.readText("wrangler.jsonc") === null) return wranglerUnreadable(ITEM, SUMMARY);
  const config = readEmailConfig(ctx);
  if (!config) {
    return couldNotCheck(
      ITEM,
      SUMMARY,
      "wrangler.jsonc has no send_email destination_address and allowed_sender_addresses.",
      "Restore wrangler.jsonc from the repository (git checkout wrangler.jsonc), then try again.",
    );
  }

  try {
    const parts: Array<[string, PartResult]> = [
      ["Destination address", await checkDestination(ctx, access.accountId, config)],
      ["Sending subdomain", await checkSubdomain(ctx, config)],
    ];
    const problems = parts.flatMap(([label, part]) => part.problems.map((line) => `${label}: ${line}`));
    const firstFailing = parts.find(([, part]) => part.problems.length > 0);
    if (firstFailing) {
      return missing(ITEM, "Contact email is not fully set up.", firstFailing[1].fix, problems);
    }
    return complete(
      ITEM,
      `Email Routing is on for ${config.subdomain} and ${config.destination} is verified.`,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → Email Routing Addresses: Read (docs/setup.md#contact-email), then try again.",
    );
  }
}
