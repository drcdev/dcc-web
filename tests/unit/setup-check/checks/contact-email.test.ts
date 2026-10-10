// Layer: unit. Setup item 17 reads two parts (destination address verified, Email Routing on for the
// sending domain drc.dev) through a fake Cloudflare reader.
import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-email.ts";
import { ProviderAccessError, type CloudflareZone } from "../../../../scripts/setup-check/types.ts";
import { ENV, contactContext } from "./contact-helpers.ts";
import { envFrom } from "./test-helpers.ts";

const WRANGLER = `{
  // comment
  "send_email": [
    {
      "name": "CONTACT_EMAIL",
      "destination_address": "contact@doncoleman.ca",
      "allowed_sender_addresses": ["contact-form@drc.dev"],
    }
  ]
}`;

const verified = { email: "contact@doncoleman.ca", verified: "2026-10-10T12:00:00Z" };
const drcZone: CloudflareZone = { id: "zone-drc", name: "drc.dev", status: "active", nameServers: [] };
const routingOn = { enabled: true, status: "ready" };

function run(opts: {
  addresses?: unknown;
  zones?: unknown;
  routing?: unknown;
  env?: Record<string, string | undefined>;
  wrangler?: string | null;
}) {
  const fn = (value: unknown, fallback: unknown) =>
    typeof value === "function" ? value : async () => (value === undefined ? fallback : value);
  const ctx = contactContext(
    {
      env: envFrom(opts.env ?? ENV),
      cloudflare: {
        listEmailRoutingAddresses: fn(opts.addresses, [verified]),
        listZones: vi.fn(fn(opts.zones, [drcZone]) as (name: string) => Promise<CloudflareZone[]>),
        getEmailRoutingSettings: vi.fn(fn(opts.routing, routingOn) as (zoneId: string) => Promise<unknown>),
      } as never,
      dns: { resolve: vi.fn(async () => []) },
    },
    { wrangler: opts.wrangler === undefined ? WRANGLER : opts.wrangler },
  );
  return { ctx, result: check(ctx) };
}

describe("checks/contact-email (item 17)", () => {
  it("is complete with the plain summary when both parts pass, reading the drc.dev zone", async () => {
    const { ctx, result: pending } = run({});
    const result = await pending;
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-email");
    expect(result.summary).toBe("Email Routing is on for drc.dev and contact@doncoleman.ca is verified.");
    expect(result.docs).toBe("docs/setup.md#contact-email");
    expect(ctx.cloudflare.listZones).toHaveBeenCalledWith("drc.dev");
    expect(ctx.cloudflare.getEmailRoutingSettings).toHaveBeenCalledWith("zone-drc");
  });

  it("never reads public DNS for a sending subdomain", async () => {
    const { ctx, result } = run({});
    await result;
    expect(ctx.dns.resolve).not.toHaveBeenCalled();
  });

  it("is missing when the destination was never added", async () => {
    const result = await run({ addresses: [] }).result;
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/Destination address: contact@doncoleman\.ca .*not added/);
  });

  it("says it is waiting for the verification link when present but unverified", async () => {
    const result = await run({ addresses: [{ email: "contact@doncoleman.ca", verified: null }] }).result;
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/waiting for the verification link/);
  });

  it("matches the destination address case-insensitively", async () => {
    const result = await run({ addresses: [{ email: "Contact@DonColeman.ca", verified: "2026-10-10T12:00:00Z" }] }).result;
    expect(result.status).toBe("complete");
  });

  it("is could-not-check on an authorisation error and names the Email Routing Addresses: Read permission", async () => {
    const result = await run({
      addresses: async () => {
        throw new ProviderAccessError("Cloudflare token lacks Email Routing Addresses: Read read access (403): x");
      },
    }).result;
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/Email Routing Addresses: Read/);
    expect(result.nextAction).toContain("Email Routing Addresses: Read");
  });

  it("is missing when Email Routing is off for drc.dev", async () => {
    const result = await run({ routing: { enabled: false, status: "unconfigured" } }).result;
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/Sending domain: Email Routing is not on for drc\.dev/);
  });

  it("is missing when Email Routing is enabled but not ready", async () => {
    const result = await run({ routing: { enabled: true, status: "misconfigured" } }).result;
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/misconfigured/);
  });

  it("is missing when the token cannot see a drc.dev zone, naming the zone resource", async () => {
    const result = await run({ zones: [] }).result;
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/drc\.dev is not a zone this token can read/);
  });

  it("is could-not-check when the routing settings read is refused, naming Email Routing Rules: Read", async () => {
    const result = await run({
      routing: async () => {
        throw new ProviderAccessError("Cloudflare token lacks Email Routing Rules: Read read access (403): x");
      },
    }).result;
    expect(result.status).toBe("could-not-check");
    expect(result.nextAction).toContain("Email Routing Rules: Read");
  });

  it("reports both parts in one run", async () => {
    const result = await run({ addresses: [], routing: { enabled: false, status: null } }).result;
    const details = result.details.join("\n");
    expect(details).toContain("Destination address:");
    expect(details).toContain("Sending domain:");
  });

  it("is could-not-check without a token or an account ID", async () => {
    expect((await run({ env: {} }).result).status).toBe("could-not-check");
    expect((await run({ env: { CLOUDFLARE_API_TOKEN: "x" } }).result).reason).toMatch(/CLOUDFLARE_ACCOUNT_ID/);
  });

  it("is could-not-check when wrangler.jsonc has no send_email destination", async () => {
    const result = await run({ wrangler: "{}" }).result;
    expect(result.status).toBe("could-not-check");
  });

  it("never puts a credential in its output", async () => {
    expect(JSON.stringify(await run({}).result)).not.toContain("cf-token-value");
  });
});
