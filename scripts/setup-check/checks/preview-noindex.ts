// checks/preview-noindex.ts (setup item 16, 011-launch contracts/setup-items.md): the preview
// Worker's workers.dev host (production is off workers.dev) sends `X-Robots-Tag: noindex` on `/` and
// `/projects/`, so previews are never indexed. Independent of the launch phase and of credentials.
import type { CheckResult, ProviderContext, SetupConfig } from "../types.ts";
import { complete, couldNotCheck, fromProviderError, missing } from "./shared.ts";

const ITEM = { id: "preview-noindex", order: 16 };
const PATHS = ["/", "/projects/"];
const NEXT_ACTION = "Confirm public/_headers has the https://:worker.:subdomain.workers.dev/* noindex rule and redeploy.";

function hasNoindex(headers: Record<string, string>): boolean {
  const value = headers["x-robots-tag"] ?? headers["X-Robots-Tag"];
  return typeof value === "string" && value.toLowerCase().includes("noindex");
}

export async function check(ctx: ProviderContext): Promise<CheckResult> {
  const config = ctx.fs.readJson<SetupConfig>("setup/config.json");
  const subdomain = config?.workersSubdomain;
  if (!subdomain) {
    return couldNotCheck(
      ITEM,
      "Could not work out the workers.dev addresses to check.",
      "workersSubdomain is not set in setup/config.json.",
      "Add workersSubdomain (the account's workers.dev subdomain) to setup/config.json, then try again.",
    );
  }
  const workers = [config?.previewWorkerName ?? "dcc-web-preview"];

  try {
    const failing: string[] = [];
    for (const worker of workers) {
      const host = `${worker}.${subdomain}.workers.dev`;
      for (const path of PATHS) {
        const response = await ctx.http.get(`https://${host}${path}`);
        if (!hasNoindex(response.headers)) failing.push(`${host}${path}`);
      }
    }

    if (failing.length > 0) {
      return missing(
        ITEM,
        `X-Robots-Tag: noindex is missing on ${failing.length} preview address(es).`,
        NEXT_ACTION,
        failing,
      );
    }
    return complete(ITEM, "The preview workers.dev host sends X-Robots-Tag: noindex on / and /projects/.");
  } catch (err) {
    return fromProviderError(
      ITEM,
      "Could not read response headers from the workers.dev addresses.",
      err,
      "Check the Workers are deployed and reachable, then try again.",
    );
  }
}
