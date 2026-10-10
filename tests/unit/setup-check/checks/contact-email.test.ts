// Layer: unit. Setup item 17 reads two parts (destination address verified, sending-subdomain
// records) through fake Cloudflare and DNS readers.
import { describe, expect, it, vi } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-email.ts";
import { ProviderAccessError, type DnsAnswer, type DnsRecordType } from "../../../../scripts/setup-check/types.ts";
import { ENV, contactContext } from "./contact-helpers.ts";
import { envFrom } from "./test-helpers.ts";

const WRANGLER = `{
  // comment
  "send_email": [
    {
      "name": "CONTACT_EMAIL",
      "destination_address": "contact@doncoleman.ca",
      "allowed_sender_addresses": ["contact-form@mail.doncoleman.ca"],
    }
  ]
}`;

const verified = { email: "contact@doncoleman.ca", verified: "2026-10-10T12:00:00Z" };
const SUB = "mail.doncoleman.ca";

function mx(host: string, priority: number): DnsAnswer {
  return { type: "MX", name: SUB, value: host, priority };
}
const goodMx = [mx("route1.mx.cloudflare.net", 12), mx("route2.mx.cloudflare.net", 41), mx("route3.mx.cloudflare.net", 85)];
const goodTxt: DnsAnswer[] = [{ type: "TXT", name: SUB, value: "v=spf1 include:_spf.mx.cloudflare.net ~all" }];

function run(opts: {
  addresses?: unknown;
  mx?: DnsAnswer[];
  txt?: DnsAnswer[];
  env?: Record<string, string | undefined>;
  wrangler?: string | null;
}) {
  const addresses = opts.addresses;
  const ctx = contactContext(
    {
      env: envFrom(opts.env ?? ENV),
      cloudflare: {
        listEmailRoutingAddresses: typeof addresses === "function" ? addresses : async () => addresses ?? [verified],
      } as never,
      dns: {
        resolve: vi.fn(async (name: string, type: DnsRecordType) =>
          name === SUB ? (type === "MX" ? (opts.mx ?? goodMx) : (opts.txt ?? goodTxt)) : [],
        ),
      },
    },
    { wrangler: opts.wrangler === undefined ? WRANGLER : opts.wrangler },
  );
  return check(ctx);
}

describe("checks/contact-email (item 17)", () => {
  it("is complete with the plain summary when both parts pass", async () => {
    const result = await run({});
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-email");
    expect(result.summary).toBe("Email Routing is on for mail.doncoleman.ca and contact@doncoleman.ca is verified.");
    expect(result.docs).toBe("docs/setup.md#contact-email");
  });

  it("is missing when the destination was never added", async () => {
    const result = await run({ addresses: [] });
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/Destination address: contact@doncoleman\.ca .*not added/);
  });

  it("says it is waiting for the verification link when present but unverified", async () => {
    const result = await run({ addresses: [{ email: "contact@doncoleman.ca", verified: null }] });
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/waiting for the verification link/);
  });

  it("matches the destination address case-insensitively", async () => {
    const result = await run({ addresses: [{ email: "Contact@DonColeman.ca", verified: "2026-10-10T12:00:00Z" }] });
    expect(result.status).toBe("complete");
  });

  it("is could-not-check on an authorisation error and names the Email Routing Addresses: Read permission", async () => {
    const result = await run({
      addresses: async () => {
        throw new ProviderAccessError("Cloudflare token lacks Email Routing Addresses: Read read access (403): x");
      },
    });
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/Email Routing Addresses: Read/);
    expect(result.nextAction).toContain("Email Routing Addresses: Read");
  });

  it("is missing when the subdomain has no Cloudflare MX records", async () => {
    const result = await run({ mx: [] });
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/Email Routing is not on for mail\.doncoleman\.ca/);
  });

  it("is missing when the MX records point elsewhere", async () => {
    const result = await run({ mx: [mx("mx01.mail.icloud.com", 10)] });
    expect(result.status).toBe("missing");
  });

  it("is missing when the SPF record lacks the Cloudflare include", async () => {
    const result = await run({ txt: [{ type: "TXT", name: SUB, value: "v=spf1 -all" }] });
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/SPF/);
  });

  it("reports both parts in one run", async () => {
    const result = await run({ addresses: [], mx: [], txt: [] });
    const details = result.details.join("\n");
    expect(details).toContain("Destination address:");
    expect(details).toContain("Sending subdomain:");
  });

  it("points at the apex check (item 5) rather than re-checking apex records", async () => {
    const result = await run({ mx: [] });
    expect([result.nextAction ?? "", ...result.details].join("\n")).toMatch(/item 5/);
  });

  it("is could-not-check without a token or an account ID", async () => {
    expect((await run({ env: {} })).status).toBe("could-not-check");
    expect((await run({ env: { CLOUDFLARE_API_TOKEN: "x" } })).reason).toMatch(/CLOUDFLARE_ACCOUNT_ID/);
  });

  it("is could-not-check when wrangler.jsonc has no send_email destination", async () => {
    const result = await run({ wrangler: "{}" });
    expect(result.status).toBe("could-not-check");
  });

  it("never puts a credential in its output", async () => {
    expect(JSON.stringify(await run({}))).not.toContain("cf-token-value");
  });
});
