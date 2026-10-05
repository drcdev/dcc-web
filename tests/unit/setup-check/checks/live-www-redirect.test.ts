import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/live-www-redirect.ts";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { HttpResponseSummary } from "../../../../scripts/setup-check/types.ts";
import { emptyAnswers, expectPendingSuffix, ghostAnswers, liveContext, tlsError } from "./live-helpers.ts";

const TARGET = "https://doncoleman.ca/about/?launch-check=1";
const moved = (status = 301, location: string | undefined = TARGET): HttpResponseSummary => ({
  status,
  headers: location === undefined ? {} : { location },
  body: "",
});

describe("checks/live-www-redirect (item 28)", () => {
  it("is waiting before the switch", async () => {
    const result = await check(liveContext({ phase: "before-switch" }));
    expect(result.status).toBe("waiting");
    expect(result.step).toBe(`Step 28 of ${setupItems.length}`);
  });

  it("is pending while a resolver still returns the Ghost CNAME", async () => {
    const result = await check(
      liveContext({
        dns: (name, type) =>
          type === "CNAME" ? ghostAnswers(name, "CNAME", "drift-and-convergence.mymagic.page.") : emptyAnswers,
      }),
    );
    expectPendingSuffix(result);
  });

  it("is pending on a TLS error", async () => {
    const result = await check(liveContext({ get: () => tlsError() }));
    expectPendingSuffix(result);
  });

  it("is could-not-check on another network failure", async () => {
    const result = await check(liveContext({ get: () => new ProviderAccessError("refused", "network") }));
    expect(result.status).toBe("could-not-check");
  });

  it("is complete for a single 301 to the exact address, on https and http, with manual redirects", async () => {
    const ctx = liveContext({ get: () => moved() });
    const result = await check(ctx);
    expect(result.status).toBe("complete");
    expect(ctx.calls.map((c) => c.url)).toEqual([
      "https://www.doncoleman.ca/about/?launch-check=1",
      "http://www.doncoleman.ca/about/?launch-check=1",
    ]);
    expect(ctx.calls.every((c) => c.redirect === "manual")).toBe(true);
  });

  it.each([
    ["a 302", moved(302), "302"],
    ["a 200", moved(200, undefined), "200"],
    ["a 301 to the wrong address", moved(301, "https://doncoleman.ca/"), "https://doncoleman.ca/"],
  ])("is a Problem naming the status and Location for %s", async (_label, response, word) => {
    const result = await check(liveContext({ get: () => response }));
    expect(result.status).toBe("missing");
    expect(result.summary).toBe("Problem: www does not permanently redirect to the bare domain.");
    expect(result.details.join(" ")).toContain(word);
    expect(result.nextAction).toMatch(/Redirect Rule/);
  });

  it("is a Problem when only the http://www path fails", async () => {
    const result = await check(liveContext({ get: (url) => (url.startsWith("https://") ? moved() : moved(302)) }));
    expect(result.status).toBe("missing");
    expect(result.details.join(" ")).toContain("http://www.doncoleman.ca");
  });
});
