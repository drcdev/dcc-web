import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setupItems } from "../../../scripts/setup-check/items.ts";
import { secretManifest } from "../../../scripts/setup-check/secrets.ts";

const docsPath = fileURLToPath(new URL("../../../docs/setup.md", import.meta.url));
const docsContents = readFileSync(docsPath, "utf-8");
const docsAnchors = new Set(
  [...docsContents.matchAll(/^##\s+.*\{#([a-z0-9-]+)\}\s*$/gm)].map((m) => m[1]),
);
const secretNames = new Set(secretManifest.map((s) => s.name));

describe("setupItems registry invariants", () => {
  it("has exactly 17 items, mail-records at 5, contact-bindings at 16 and contact-email last", () => {
    expect(setupItems).toHaveLength(17);
    expect(setupItems[4]!.id).toBe("mail-records");
    expect(setupItems[15]!.id).toBe("contact-bindings");
    expect(setupItems[16]!.id).toBe("contact-email");
  });

  it("preview-noindex and web-analytics depend on no other item", () => {
    for (const id of ["preview-noindex", "web-analytics"]) {
      expect(setupItems.find((i) => i.id === id)!.dependsOn).toEqual([]);
    }
  });

  it("items 1 to 8 and 17 are before-merge and 9 to 16 are after-merge", () => {
    for (const item of setupItems.slice(0, 8)) expect(item.phase).toBe("before-merge");
    for (const item of setupItems.slice(8, 16)) expect(item.phase).toBe("after-merge");
    expect(setupItems[16]!.phase).toBe("before-merge");
  });

  it("item 2 names the three new read permissions and item 9 names the preview Worker", () => {
    const item2 = setupItems.find((i) => i.id === "local-credentials")!;
    for (const p of ["D1", "Workers Builds Configuration", "Turnstile Sites"]) expect(item2.where).toContain(p);
    const workersBuilds = setupItems.find((i) => i.id === "workers-builds")!;
    expect(workersBuilds.where).toContain("dcc-web-preview");
  });

  it("the contact bindings item's where text restates the region (FR-027a)", () => {
    const where = setupItems.find((i) => i.id === "contact-bindings")!.where;
    expect(where).toContain("wnam");
    expect(where).toContain("Western North America");
  });

  it("item 17 is the contact email item the contract describes", () => {
    const item = setupItems.find((i) => i.id === "contact-email")!;
    expect(item.order).toBe(17);
    expect(item.phase).toBe("before-merge");
    expect(item.needsDon).toBe(true);
    expect(item.principles).toEqual(["VII", "VIII", "IX"]);
    expect(item.dependsOn).toEqual(["local-credentials"]);
    expect(item.where).toContain("drc.dev");
    expect(item.where + item.purpose + item.confirmedBy).not.toMatch(/mail\.doncoleman\.ca|subdomain/i);
  });

  it("item 16 needs only the Turnstile secret and the manifest has no retired contact secrets", () => {
    const item = setupItems.find((i) => i.id === "contact-bindings")!;
    expect(item.secrets).toEqual(["TURNSTILE_SECRET_KEY", "PUBLIC_TURNSTILE_SITE_KEY"]);
    expect(item.where + item.confirmedBy + item.purpose).not.toMatch(/has its cron|three (Worker )?secret/i);
    expect(secretNames.has("CONTACT_READ_TOKEN")).toBe(false);
    expect(secretNames.has("IP_HASH_SALT")).toBe(false);
  });

  it("the read-only token's manifest entry names Email Routing Addresses Read for contact-email", () => {
    const token = secretManifest.find((s) => s.name === "CLOUDFLARE_API_TOKEN")!;
    expect(token.permissions).toContain("Email Routing Addresses Read");
    expect(token.permissions).toContain("Email Routing Rules Read");
    expect(token.usedBy).toContain("contact-email");
    expect(secretManifest.find((s) => s.name === "CLOUDFLARE_ACCOUNT_ID")!.usedBy).toContain("contact-email");
  });

  it("has unique ids", () => {
    const ids = setupItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique, ascending order numbers starting at 1", () => {
    const orders = setupItems.map((item) => item.order).sort((a, b) => a - b);
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual(Array.from({ length: setupItems.length }, (_, i) => i + 1));
  });

  it.each(setupItems.map((item) => [item.id, item] as const))(
    "%s has non-empty text fields",
    (_id, item) => {
      for (const field of ["title", "purpose", "where", "confirmedBy"] as const) {
        expect(item[field].length, `${item.id}.${field} must not be empty`).toBeGreaterThan(0);
      }
      expect(item.principles.length, `${item.id}.principles must not be empty`).toBeGreaterThan(0);
      expect(item.requirements.length, `${item.id}.requirements must not be empty`).toBeGreaterThan(0);
    },
  );

  it("every secrets entry exists in the manifest", () => {
    for (const item of setupItems) {
      for (const secretName of item.secrets) {
        expect(secretNames.has(secretName), `${item.id} references unknown secret ${secretName}`).toBe(
          true,
        );
      }
    }
  });

  it("every dependsOn entry refers to an earlier item (no forward references, no cycles)", () => {
    const orderById = new Map(setupItems.map((item) => [item.id, item.order]));
    for (const item of setupItems) {
      for (const dep of item.dependsOn) {
        expect(orderById.has(dep), `${item.id} depends on unknown item ${dep}`).toBe(true);
        expect(
          orderById.get(dep)!,
          `${item.id} (order ${item.order}) must depend only on earlier items, not ${dep} (order ${orderById.get(dep)})`,
        ).toBeLessThan(item.order);
      }
    }
  });

  it("every item has a matching docs/setup.md anchor", () => {
    for (const item of setupItems) {
      expect(docsAnchors.has(item.id), `docs/setup.md is missing an anchor for ${item.id}`).toBe(true);
    }
  });

  it("each item's check is a function", () => {
    for (const item of setupItems) {
      expect(typeof item.check).toBe("function");
    }
  });

  it("each item's phase is before-merge or after-merge, matching the plan's walkthrough order", () => {
    for (const item of setupItems) {
      expect(["before-merge", "after-merge"]).toContain(item.phase);
    }
    // Items 1-8 are before-merge, 9-16 are after-merge (plan.md walkthrough order).
    const beforeMerge = setupItems.filter((i) => i.order <= 8);
    const afterMerge = setupItems.filter((i) => i.order >= 9 && i.order <= 16);
    expect(beforeMerge.every((i) => i.phase === "before-merge")).toBe(true);
    expect(afterMerge.every((i) => i.phase === "after-merge")).toBe(true);
  });
});
