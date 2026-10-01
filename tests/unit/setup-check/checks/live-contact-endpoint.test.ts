import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/live-contact-endpoint.ts";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { HttpResponseSummary } from "../../../../scripts/setup-check/types.ts";
import { loadFixture } from "./test-helpers.ts";
import { expectPendingSuffix, liveContext, tlsError } from "./live-helpers.ts";

const good = loadFixture<HttpResponseSummary>("http", "live-contact-method-not-allowed");

describe("checks/live-contact-endpoint (item 31)", () => {
  it("is waiting before the switch", async () => {
    const result = await check(liveContext({ phase: "before-switch" }));
    expect(result.status).toBe("waiting");
    expect(result.step).toBe(`Step 31 of ${setupItems.length}`);
  });

  it("is complete for 405, Allow: POST and the JSON body, with exactly one GET and no POST", async () => {
    const ctx = liveContext({ get: () => good });
    const result = await check(ctx);
    expect(result.status).toBe("complete");
    expect(ctx.calls).toEqual([{ url: "https://doncoleman.ca/api/contact", redirect: "manual" }]);
  });

  it("is pending on a TLS error", async () => {
    const result = await check(liveContext({ get: () => tlsError() }));
    expectPendingSuffix(result);
  });

  it("is could-not-check on another network failure", async () => {
    const result = await check(liveContext({ get: () => new ProviderAccessError("refused", "network") }));
    expect(result.status).toBe("could-not-check");
  });

  it.each([
    ["a 200", { ...good, status: 200 }, "200"],
    ["a 404", { ...good, status: 404 }, "404"],
    ["a missing Allow header", { ...good, headers: {} }, "Allow"],
    ["a wrong Allow header", { ...good, headers: { allow: "GET" } }, "Allow"],
    ["a non-JSON body", { ...good, body: "<html>nope</html>" }, "JSON"],
    ["a wrong JSON body", { ...good, body: '{"ok":true}' }, "JSON"],
  ])("is a Problem for %s", async (_label, response, word) => {
    const result = await check(liveContext({ get: () => response as HttpResponseSummary }));
    expect(result.status).toBe("missing");
    expect(result.summary.startsWith("Problem:")).toBe(true);
    expect(`${result.summary} ${result.details.join(" ")}`).toContain(word);
  });
});
