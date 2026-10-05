import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/preview-noindex.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext, envFrom } from "./test-helpers.ts";

const CONFIG = {
  zone: "doncoleman.ca",
  workerName: "dcc-web",
  previewWorkerName: "dcc-web-preview",
  workersSubdomain: "drc-dev",
};
const HOSTS = ["dcc-web-preview.drc-dev.workers.dev"];

type Get = (url: string) => Promise<{ status: number; headers: Record<string, string>; body: string }>;

function ctxWith(get: Get, config: Record<string, unknown> = CONFIG) {
  return fakeProviderContext({
    env: envFrom({}),
    fs: { readJson: (() => config) as never },
    http: { get: get as never },
  });
}

const noindex = { status: 200, headers: { "x-robots-tag": "noindex" }, body: "" };
const indexable = { status: 200, headers: {}, body: "" };

describe("checks/preview-noindex (T047)", () => {
  it("is complete when the preview workers.dev host sends noindex on / and /projects/, with no credentials needed", async () => {
    const seen: string[] = [];
    const result = await check(
      ctxWith(async (url) => {
        seen.push(url);
        return noindex;
      }),
    );

    expect(result.status).toBe("complete");
    expect(result.step).toBe(`Step 16 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#preview-noindex");
    expect(seen.some((u) => u.includes("//dcc-web.drc-dev"))).toBe(false);
    expect([...seen].sort()).toEqual(HOSTS.flatMap((h) => [`https://${h}/`, `https://${h}/projects/`]).sort());
  });

  it("is missing and lists each failing host and path", async () => {
    const result = await check(
      ctxWith(async (url) =>
        url === "https://dcc-web-preview.drc-dev.workers.dev/projects/" ? indexable : noindex,
      ),
    );

    expect(result.status).toBe("missing");
    expect(result.details).toEqual(["dcc-web-preview.drc-dev.workers.dev/projects/"]);
    expect(result.nextAction).toBe(
      "Confirm public/_headers has the https://:worker.:subdomain.workers.dev/* noindex rule and redeploy.",
    );
  });

  it("is could-not-check when a host cannot be reached", async () => {
    const result = await check(
      ctxWith(async () => {
        throw new ProviderAccessError("timed out");
      }),
    );

    expect(result.status).toBe("could-not-check");
  });

  it("is could-not-check when workersSubdomain is not in setup/config.json", async () => {
    const result = await check(ctxWith(async () => noindex, { ...CONFIG, workersSubdomain: undefined }));

    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/workersSubdomain/);
  });
});
