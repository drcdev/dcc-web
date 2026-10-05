// checks/contact-turnstile-widget.ts (setup item 19, contracts/setup-items.md): a managed
// Turnstile widget named "dcc-web contact" exists and covers doncoleman.ca. It must also cover
// drc-dev.workers.dev, unless the dashboard refused that hostname and the preview fallback
// (research R6, always-pass test keys for preview only) is in use. The fallback is recognised
// by the preview site-key build variable existing (item 22). The reader keeps only name,
// domains and mode; the site key and secret never reach this module.
import type { CheckResult, ProviderContext } from "../types.ts";
import {
  SITE_KEY_VARIABLE,
  isCheckResult,
  requireCloudflareAccess,
  workerNames,
} from "./contact-shared.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "contact-turnstile-widget", order: 19 };
const SUMMARY = "Could not read the Turnstile widget.";
const WIDGET_NAME = "dcc-web contact";
const PRODUCTION_HOST = "doncoleman.ca";
const PREVIEW_HOST = "drc-dev.workers.dev";

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const access = requireCloudflareAccess(ctx, ITEM, SUMMARY);
  if (isCheckResult(access)) return access;

  try {
    const widgets = await ctx.cloudflare.listTurnstileWidgets(access.accountId);
    const widget = widgets.find((w) => w.name === WIDGET_NAME);
    if (!widget) {
      return missing(
        ITEM,
        `The Turnstile widget "${WIDGET_NAME}" does not exist yet.`,
        `Create it: Cloudflare dashboard → Turnstile → Add widget, name "${WIDGET_NAME}", hostnames ${PRODUCTION_HOST} and ${PREVIEW_HOST}, mode Managed.`,
      );
    }

    const details: string[] = [];
    const hosts = widget.domains.map((d) => d.toLowerCase());
    if (widget.mode !== "managed") {
      details.push(`The widget mode is "${widget.mode}"; it must be managed.`);
    }
    if (!hosts.includes(PRODUCTION_HOST)) {
      details.push(`The widget's hostnames do not include ${PRODUCTION_HOST}.`);
    }

    const notes: string[] = [];
    if (!hosts.includes(PREVIEW_HOST)) {
      const names = workerNames(ctx);
      const triggers = await ctx.cloudflare.listBuildTriggers(access.accountId, names.preview);
      let fallback = false;
      for (const trigger of triggers) {
        const variables = await ctx.cloudflare.listBuildVariableNames(access.accountId, trigger.uuid);
        if (variables.includes(SITE_KEY_VARIABLE)) fallback = true;
      }
      if (fallback) {
        notes.push(
          `The widget does not list ${PREVIEW_HOST}; the preview fallback (test keys, preview only) is in use.`,
        );
      } else {
        details.push(`The widget's hostnames do not include ${PREVIEW_HOST}.`);
      }
    }

    if (details.length > 0) {
      return missing(
        ITEM,
        `The Turnstile widget "${WIDGET_NAME}" is not configured as expected.`,
        `Edit the widget in Cloudflare dashboard → Turnstile: managed mode, hostnames ${PRODUCTION_HOST} and ${PREVIEW_HOST}. If the dashboard refuses ${PREVIEW_HOST}, use the preview fallback with test keys (specs/007-contact-form/research.md, R6).`,
        details,
      );
    }
    return complete(ITEM, `The Turnstile widget "${WIDGET_NAME}" exists in managed mode with the right hostnames.`, notes);
  } catch (err) {
    return fromProviderError(
      ITEM,
      SUMMARY,
      err,
      "Check the Cloudflare API token in .env is valid and has Account → Turnstile Sites: Read (and Workers Builds Configuration: Read), then try again.",
    );
  }
}
