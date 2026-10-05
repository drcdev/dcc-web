// checks/live-contact-endpoint.ts (setup item 30, 011-launch contracts/setup-items.md; FR-015): once
// switched, `GET /api/contact` on the bare domain answers 405 with `Allow: POST` and the JSON
// `{ ok: false, error: "method_not_allowed" }`, which proves the Worker answers /api/* there. It
// sends one GET and never a POST, so no message is ever created.
import type { CheckResult, HttpResponseSummary, ProviderContext } from "../types.ts";
import { complete, fromProviderError, missing } from "./shared.ts";
import { gateOnSwitch, isTlsError, pendingLive } from "./live-shared.ts";

const ITEM = { id: "live-contact-endpoint", order: 30 };

function header(response: HttpResponseSummary, name: string): string | undefined {
  const key = Object.keys(response.headers).find((k) => k.toLowerCase() === name);
  return key ? response.headers[key] : undefined;
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const gate = await gateOnSwitch(
    ctx,
    ITEM,
    "Waiting for the switch: the contact endpoint is checked once the bare domain is live.",
    "Could not tell whether the domain has switched, so the contact endpoint cannot be checked.",
  );
  if ("result" in gate) return gate.result;
  const url = `https://${gate.setup.zone}/api/contact`;

  let response: HttpResponseSummary;
  try {
    response = await ctx.http.get(url, { redirect: "manual" });
  } catch (err) {
    if (isTlsError(err)) {
      return pendingLive(
        ITEM,
        `The certificate for ${gate.setup.zone} is not issued yet.`,
        "Wait for Cloudflare to issue the certificate, then run this check again.",
      );
    }
    return fromProviderError(ITEM, `Could not reach ${url}.`, err, "Check the network connection, then run this check again.");
  }

  const problems: string[] = [];
  if (response.status !== 405) problems.push(`status: GET ${url} returned ${response.status}, expected 405`);
  const allow = header(response, "allow");
  if (allow?.trim().toUpperCase() !== "POST") problems.push(`Allow header: found ${allow ?? "none"}, expected POST`);
  let body: unknown = null;
  try {
    body = JSON.parse(response.body);
  } catch {
    // reported below
  }
  const parsed = body as { ok?: unknown; error?: unknown } | null;
  if (!parsed || typeof parsed !== "object" || parsed.ok !== false || parsed.error !== "method_not_allowed") {
    problems.push('JSON body: expected { "ok": false, "error": "method_not_allowed" }');
  }

  if (problems.length > 0) {
    return missing(
      ITEM,
      `Problem: the contact endpoint on ${gate.setup.zone} returned ${response.status}, not the expected 405 from the Worker.`,
      "Confirm the Worker owns the bare domain (a Custom Domain on dcc-web) and that /api/contact is deployed, then run this check again; if it cannot be fixed, follow docs/launch.md#rollback.",
      problems,
    );
  }
  return complete(ITEM, `The contact endpoint on ${gate.setup.zone} answers 405 with Allow: POST, so the Worker is serving /api/*.`);
}
