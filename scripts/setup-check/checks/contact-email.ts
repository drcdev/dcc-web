// checks/contact-email (setup item 17): Email Routing is set up for the contact form. Two
// read-only parts run in one pass, so one run shows every gap:
//   Destination address  the address in wrangler.jsonc `send_email[0].destination_address` exists in
//                        the account's Email Routing destination addresses with a verified timestamp.
//   Sending domain       the domain of `allowed_sender_addresses[0]` (drc.dev) is a zone the token can
//                        read, and Email Routing is enabled and ready on it.
// The form sends from drc.dev so doncoleman.ca's DNS and iCloud mail are never touched; item 5
// (`mail-records`) still guards those. Nothing here reads a secret value.
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

async function checkSendingDomain(ctx: ProviderContext, config: EmailConfig): Promise<PartResult> {
  const domain = config.sendingDomain;
  const fix = `In Cloudflare dashboard → ${domain} → Email → Email Routing, make sure routing is enabled and shows no DNS warnings, and that the read-only token covers the ${domain} zone with Zone: Read and Email Routing Rules: Read (${DOCS}).`;
  const zone = (await ctx.cloudflare.listZones(domain)).find((z) => z.name.toLowerCase() === domain.toLowerCase());
  if (!zone) {
    return { problems: [`${domain} is not a zone this token can read; add the ${domain} zone to the token's zone resources.`], fix };
  }
  const settings = await ctx.cloudflare.getEmailRoutingSettings(zone.id);
  const problems: string[] = [];
  if (!settings.enabled) {
    problems.push(`Email Routing is not on for ${domain}.`);
  } else if (settings.status !== null && settings.status !== "ready") {
    problems.push(`Email Routing is on for ${domain} but Cloudflare reports it as ${settings.status}.`);
  }
  return { problems, fix };
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
      ["Sending domain", await checkSendingDomain(ctx, config)],
    ];
    const problems = parts.flatMap(([label, part]) => part.problems.map((line) => `${label}: ${line}`));
    const firstFailing = parts.find(([, part]) => part.problems.length > 0);
    if (firstFailing) {
      return missing(ITEM, "Contact email is not fully set up.", firstFailing[1].fix, problems);
    }
    return complete(
      ITEM,
      `Email Routing is on for ${config.sendingDomain} and ${config.destination} is verified.`,
    );
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → Email Routing Addresses: Read, plus Zone: Read and Email Routing Rules: Read on the drc.dev zone (docs/setup.md#contact-email), then try again.",
    );
  }
}
