import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-turnstile-widget.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import { contactContext, nonProdTrigger, trigger } from "./contact-helpers.ts";

const widget = {
  name: "dcc-web contact",
  domains: ["doncoleman.ca", "drc-dev.workers.dev"],
  mode: "managed",
};

describe("checks/contact-turnstile-widget", () => {
  it("is complete for a managed widget covering production and preview hostnames", async () => {
    const result = await check(contactContext({ cloudflare: { listTurnstileWidgets: async () => [widget] } }));
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-turnstile-widget");
  });

  it("is missing when the widget does not exist", async () => {
    const result = await check(
      contactContext({ cloudflare: { listTurnstileWidgets: async () => [{ ...widget, name: "other" }] } }),
    );
    expect(result.status).toBe("missing");
    expect(result.summary).toMatch(/dcc-web contact/);
  });

  it("is missing when the widget is not in managed mode", async () => {
    const result = await check(
      contactContext({ cloudflare: { listTurnstileWidgets: async () => [{ ...widget, mode: "invisible" }] } }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/managed/);
  });

  it("is missing when doncoleman.ca is not a hostname", async () => {
    const result = await check(
      contactContext({
        cloudflare: { listTurnstileWidgets: async () => [{ ...widget, domains: ["drc-dev.workers.dev"] }] },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/doncoleman\.ca/);
  });

  it("stays missing when the hostnames only list subdomains of the bare domain, so launch readiness can cite it (FR-003)", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listTurnstileWidgets: async () => [
            { ...widget, domains: ["www.doncoleman.ca", "new.doncoleman.ca", "drc-dev.workers.dev"] },
          ],
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toContain("do not include doncoleman.ca");
  });

  it("is missing when drc-dev.workers.dev is absent and the preview site-key variable is not set (no fallback in use)", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listTurnstileWidgets: async () => [{ ...widget, domains: ["doncoleman.ca"] }],
          listBuildTriggers: async () => [trigger(), nonProdTrigger()],
          listBuildVariableNames: async () => [],
        },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/drc-dev\.workers\.dev/);
    expect(result.nextAction).toMatch(/test keys|fallback/i);
  });

  it("is complete with a note when the workers.dev hostname is refused and the preview fallback is in use", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listTurnstileWidgets: async () => [{ ...widget, domains: ["doncoleman.ca"] }],
          listBuildTriggers: async () => [trigger(), nonProdTrigger()],
          listBuildVariableNames: async () => ["PUBLIC_TURNSTILE_SITE_KEY"],
        },
      }),
    );
    expect(result.status).toBe("complete");
    expect(result.details.join("\n")).toMatch(/fallback/i);
  });

  it("is could-not-check without credentials", async () => {
    const result = await check(contactContext({ env: envFrom({}) }));
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_API_TOKEN/);
  });

  it("is could-not-check when the token lacks Turnstile Sites: Read", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listTurnstileWidgets: async () => {
            throw new ProviderAccessError("Cloudflare token lacks Turnstile Sites: Read read access (403): x");
          },
        },
      }),
    );
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/Turnstile Sites: Read/);
  });
});
