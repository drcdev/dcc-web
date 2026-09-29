// checks/review-address-noindex.ts (setup item 17, data-model.md
// "review-address-noindex"): every response from new.doncoleman.ca carries
// X-Robots-Tag: noindex, checked on more than one path so the rule is
// confirmed to apply site-wide, not only "/" (FR-020). Stays missing while
// review-address is not complete.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { check as checkReviewAddress } from "./review-address.ts";
import { complete, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "review-address-noindex", order: 17 };
const CHECKED_PATHS = ["/", "/preview-check"];

function hasNoindex(headers: Record<string, string>): boolean {
  const value = headers["x-robots-tag"] ?? headers["X-Robots-Tag"];
  return typeof value === "string" && value.toLowerCase().includes("noindex");
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const reviewAddress = await checkReviewAddress(ctx);
  if (reviewAddress.status !== "complete") {
    return missing(
      ITEM,
      "Review address (step 16) is not complete yet.",
      "Complete the review address first: finish step 16 (review address), then try this step.",
    );
  }

  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const reviewHost = config?.reviewHost ?? "new.doncoleman.ca";

  try {
    const failingPaths: string[] = [];
    for (const path of CHECKED_PATHS) {
      const response = await ctx.http.get(`https://${reviewHost}${path}`);
      if (!hasNoindex(response.headers)) {
        failingPaths.push(path);
      }
    }

    if (failingPaths.length > 0) {
      return missing(
        ITEM,
        `https://${reviewHost}/ does not send X-Robots-Tag: noindex on every path (missing on ${failingPaths.join(", ")}).`,
        "Confirm public/_headers sets X-Robots-Tag: noindex on /* and redeploy.",
        failingPaths,
      );
    }

    return complete(ITEM, `https://${reviewHost}/ sends X-Robots-Tag: noindex on every path checked.`);
  } catch (err) {
    return fromProviderError(
      ITEM,
      `Could not read response headers from ${reviewHost}.`,
      err,
      "Check the review address is reachable, then try again.",
    );
  }
}
