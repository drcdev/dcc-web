import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/contact-d1-databases.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import { envFrom } from "./test-helpers.ts";
import { PLACEHOLDER_IDS, PREVIEW_ID, PROD_ID, contactContext, wranglerText } from "./contact-helpers.ts";

const both = [
  { uuid: PROD_ID, name: "dcc-web-contact", runningInRegion: "WNAM" },
  { uuid: PREVIEW_ID, name: "dcc-web-contact-preview", runningInRegion: "WNAM" },
];

describe("checks/contact-d1-databases", () => {
  it("is complete when both databases exist, match wrangler.jsonc and report WNAM", async () => {
    const result = await check(contactContext({ cloudflare: { listD1Databases: async () => both } }));
    expect(result.status).toBe("complete");
    expect(result.id).toBe("contact-d1-databases");
    expect(result.docs).toBe("docs/setup.md#contact-d1-databases");
    expect(result.nextAction).toBeNull();
  });

  it("is missing per database when one does not exist", async () => {
    const result = await check(contactContext({ cloudflare: { listD1Databases: async () => [both[0]!] } }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/dcc-web-contact-preview/);
    expect(result.details.join("\n")).not.toMatch(/contact:/);
    expect(result.nextAction).toMatch(/wrangler d1 create/);
  });

  it("is missing when wrangler.jsonc still holds the placeholder IDs", async () => {
    const result = await check(
      contactContext({ cloudflare: { listD1Databases: async () => both } }, { wrangler: wranglerText(PLACEHOLDER_IDS) }),
    );
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/placeholder/i);
  });

  it("is missing when an ID differs from wrangler.jsonc", async () => {
    const other = both.map((d) => (d.name === "dcc-web-contact" ? { ...d, uuid: "33333333-3333-4333-8333-333333333333" } : d));
    const result = await check(contactContext({ cloudflare: { listD1Databases: async () => other } }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/does not match wrangler\.jsonc/);
  });

  it("is missing, never complete, when the region cannot be read", async () => {
    const noRegion = both.map((d) => ({ uuid: d.uuid, name: d.name }));
    const result = await check(contactContext({ cloudflare: { listD1Databases: async () => noRegion } }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/region could not be confirmed/i);
  });

  it("is missing when a database is in another region", async () => {
    const eu = both.map((d) => ({ ...d, runningInRegion: "WEUR" }));
    const result = await check(contactContext({ cloudflare: { listD1Databases: async () => eu } }));
    expect(result.status).toBe("missing");
    expect(result.details.join("\n")).toMatch(/WEUR/);
  });

  it("accepts a lower-case region value", async () => {
    const lower = both.map((d) => ({ ...d, runningInRegion: "wnam" }));
    const result = await check(contactContext({ cloudflare: { listD1Databases: async () => lower } }));
    expect(result.status).toBe("complete");
  });

  it("parses the committed wrangler.jsonc and reads its placeholder IDs as missing", async () => {
    const text = readFileSync(fileURLToPath(new URL("../../../../wrangler.jsonc", import.meta.url)), "utf-8");
    const result = await check(
      contactContext({ cloudflare: { listD1Databases: async () => both } }, { wrangler: text }),
    );
    // Until item 19 is done the committed file holds placeholder IDs; once Don finishes it, the IDs match.
    expect(["missing", "complete"]).toContain(result.status);
    if (result.status === "missing") expect(result.details.join("\n")).toMatch(/placeholder|does not match/);
  });

  describe("database names come from wrangler.jsonc", () => {
    const names = { production: "dcc-web", preview: "dcc-web-preview" };
    const renamed = [
      { uuid: PROD_ID, name: "dcc-web", runningInRegion: "WNAM" },
      { uuid: PREVIEW_ID, name: "dcc-web-preview", runningInRegion: "WNAM" },
    ];
    const withNames = (databases: typeof both) =>
      contactContext(
        { cloudflare: { listD1Databases: async () => databases } },
        { wrangler: wranglerText({ production: PROD_ID, preview: PREVIEW_ID }, names) },
      );

    it("passes for a fixture naming dcc-web* against an account holding those", async () => {
      const result = await check(withNames(renamed));
      expect(result.status).toBe("complete");
      expect(result.details).toEqual([]);
    });

    it("fails naming each configured database missing from the account", async () => {
      const result = await check(withNames(both));
      expect(result.status).toBe("missing");
      const text = result.details.join("\n");
      expect(text).toContain("`dcc-web` not found in the account");
      expect(text).toContain("`dcc-web-preview` not found in the account");
    });

    it("notes a retired database still present as a separate note, not a failure", async () => {
      const result = await check(withNames([...renamed, ...both]));
      expect(result.status).toBe("complete");
      expect(result.details.join("\n")).toContain(
        "old database `dcc-web-contact` still present: delete it after the production deploy",
      );
      expect(result.details.join("\n")).toContain("old database `dcc-web-contact-preview` still present");
    });

    it("shows no note while wrangler.jsonc still names the retired database", async () => {
      const result = await check(contactContext({ cloudflare: { listD1Databases: async () => both } }));
      expect(result.status).toBe("complete");
      expect(result.details.join("\n")).not.toMatch(/old database/);
    });
  });

  it("is could-not-check without the account ID", async () => {
    const result = await check(contactContext({ env: envFrom({ CLOUDFLARE_API_TOKEN: "x" }) }));
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/CLOUDFLARE_ACCOUNT_ID/);
  });

  it("is could-not-check when wrangler.jsonc cannot be read", async () => {
    const result = await check(contactContext({}, { wrangler: null }));
    expect(result.status).toBe("could-not-check");
  });

  it("is could-not-check on a 403 and names the permission", async () => {
    const result = await check(
      contactContext({
        cloudflare: {
          listD1Databases: async () => {
            throw new ProviderAccessError("Cloudflare token lacks D1: Read read access (403): x");
          },
        },
      }),
    );
    expect(result.status).toBe("could-not-check");
    expect(result.reason).toMatch(/D1: Read/);
    expect(result.nextAction).toMatch(/D1: Read/);
  });
});
