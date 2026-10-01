import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/live-apex.ts";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { HttpResponseSummary } from "../../../../scripts/setup-check/types.ts";
import { expectRedacted, loadFixture } from "./test-helpers.ts";
import { ENV, emptyAnswers, expectPendingSuffix, ghostAnswers, liveContext, tlsError } from "./live-helpers.ts";

const newSite = loadFixture<HttpResponseSummary>("http", "live-apex-new-site");
const ghostSite = loadFixture<HttpResponseSummary>("http", "live-domain-ghost-marker-present");
const redirect = (status = 301, location = "https://doncoleman.ca/"): HttpResponseSummary => ({
  status,
  headers: { location },
  body: "",
});

function serve(https: HttpResponseSummary | ProviderAccessError, http: HttpResponseSummary | ProviderAccessError = redirect()) {
  return (url: string) => (url.startsWith("https://") ? https : http);
}

describe("checks/live-apex (item 28)", () => {
  it("is waiting before the switch", async () => {
    const result = await check(liveContext({ phase: "before-switch" }));
    expect(result.status).toBe("waiting");
    expect(result.step).toBe(`Step 28 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#live-apex");
  });

  it("is could-not-check when the phase cannot be read, without printing credentials", async () => {
    const result = await check(liveContext({ phase: "unreadable" }));
    expect(result.status).toBe("could-not-check");
    expectRedacted(result, [ENV.CLOUDFLARE_API_TOKEN, ENV.CLOUDFLARE_ACCOUNT_ID]);
  });

  it("is pending while one resolver still returns the Ghost address, with the 24-hour sentence", async () => {
    const result = await check(
      liveContext({ dns: (name, type) => (type === "A" ? ghostAnswers(name, "A", "49.13.201.194") : emptyAnswers) }),
    );
    expectPendingSuffix(result);
    expect(result.summary).toBe("DNS for doncoleman.ca is still settling.");
  });

  it("is pending while a resolver has no answer yet", async () => {
    const result = await check(
      liveContext({
        dns: (name, type) =>
          type === "A"
            ? [
                { resolver: "1.1.1.1", answers: [{ type: "A", name, value: "104.21.0.1" }] },
                { resolver: "8.8.8.8", answers: [] },
              ]
            : emptyAnswers,
      }),
    );
    expectPendingSuffix(result);
  });

  it("is pending on a TLS error, with the 24-hour sentence", async () => {
    const result = await check(liveContext({ get: serve(tlsError()) }));
    expectPendingSuffix(result);
    expect(result.summary).toBe("The certificate for doncoleman.ca is not issued yet.");
  });

  it("is could-not-check on any other network failure", async () => {
    const result = await check(liveContext({ get: serve(new ProviderAccessError("connection refused", "network")) }));
    expect(result.status).toBe("could-not-check");
  });

  it("is complete for the new site with an http to https redirect, using manual redirects", async () => {
    const ctx = liveContext({ get: serve(newSite) });
    const result = await check(ctx);
    expect(result.status).toBe("complete");
    expect(ctx.calls.every((c) => c.redirect === "manual")).toBe(true);
    expect(ctx.calls.map((c) => c.url)).toEqual(["https://doncoleman.ca/", "http://doncoleman.ca/"]);
  });

  it("accepts a 308 for http", async () => {
    const result = await check(liveContext({ get: serve(newSite, redirect(308)) }));
    expect(result.status).toBe("complete");
  });

  it.each([
    ["a wrong status", { ...newSite, status: 404 }, "status"],
    ["a wrong canonical", { ...newSite, body: newSite.body.replace('href="https://doncoleman.ca/"', 'href="https://new.doncoleman.ca/"') }, "canonical"],
    ["a noindex header", { ...newSite, headers: { "x-robots-tag": "noindex, nofollow" } }, "X-Robots-Tag"],
    ["a noindex meta tag", { ...newSite, body: newSite.body.replace("<title>", '<meta name="robots" content="noindex"><title>') }, "meta"],
    ["the Ghost marker", { ...newSite, body: newSite.body.replace("<title>", '<meta name="generator" content="Ghost 5.75"><title>') }, "Ghost"],
  ] as const)("is a Problem for %s", async (_label, response, word) => {
    const result = await check(liveContext({ get: serve(response as HttpResponseSummary) }));
    expect(result.status).toBe("missing");
    expect(result.summary.startsWith("Problem:")).toBe(true);
    expect(result.details.join(" ")).toContain(word);
  });

  it("points to the rollback when the page is not the new site, and to the indexing contract when only noindex fails", async () => {
    const notNew = await check(liveContext({ get: serve(ghostSite) }));
    expect(notNew.status).toBe("missing");
    expect(notNew.nextAction).toContain("docs/launch.md#rollback");
    const noindexOnly = await check(liveContext({ get: serve({ ...newSite, headers: { "x-robots-tag": "noindex" } }) }));
    expect(noindexOnly.nextAction).toContain("indexing-and-origin");
  });

  it.each([
    ["an http response that does not redirect", { status: 200, headers: {}, body: "" }],
    ["a temporary redirect", redirect(302)],
    ["a redirect to the wrong address", redirect(301, "https://www.doncoleman.ca/")],
  ])("is missing with the Always Use HTTPS action for %s", async (_label, http) => {
    const result = await check(liveContext({ get: serve(newSite, http) }));
    expect(result.status).toBe("missing");
    expect(result.nextAction).toMatch(/Always Use HTTPS/);
  });
});
