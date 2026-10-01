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
const CONTACT_IDS = [
  "contact-d1-databases",
  "contact-turnstile-widget",
  "contact-worker-secrets",
  "contact-preview-builds",
  "contact-turnstile-site-key",
  "contact-preview-deploy",
  "contact-production-deploy",
];
const secretNames = new Set(secretManifest.map((s) => s.name));

describe("setupItems registry invariants", () => {
  it("has exactly 27 items, the contact-form items at 19 to 25 and the launch items at 26 and 27", () => {
    expect(setupItems).toHaveLength(27);
    expect(setupItems.slice(18, 25).map((i) => i.id)).toEqual(CONTACT_IDS);
    expect(setupItems.slice(25).map((i) => i.id)).toEqual(["launch-content-ready", "launch-main-checks"]);
  });

  it("item 26 is before-merge and needs Don, item 27 is after-merge (011-launch)", () => {
    const item26 = setupItems[25]!;
    expect(item26.phase).toBe("before-merge");
    expect(item26.needsDon).toBe(true);
    expect(setupItems[26]!.phase).toBe("after-merge");
  });

  it("contact items 19 to 24 are before-merge and item 25 is after-merge and deferred until merge (FR-028a)", () => {
    for (const item of setupItems.slice(18, 24)) expect(item.phase).toBe("before-merge");
    const last = setupItems[24]!;
    expect(last.phase).toBe("after-merge");
    expect(last.deferredUntilMerge).toBe(true);
    expect(setupItems.filter((i) => i.deferredUntilMerge)).toHaveLength(1);
  });

  it("item 2 names the three new read permissions and item 10 names the preview Worker", () => {
    const item2 = setupItems.find((i) => i.id === "local-credentials")!;
    for (const p of ["D1", "Workers Builds Configuration", "Turnstile Sites"]) expect(item2.where).toContain(p);
    const item10 = setupItems.find((i) => i.id === "workers-builds")!;
    expect(item10.where).toContain("dcc-web-preview");
  });

  it("item 19's where text restates the region and gives the exact d1 create commands (FR-027a)", () => {
    const where = setupItems.find((i) => i.id === "contact-d1-databases")!.where;
    expect(where).toContain("wnam");
    expect(where).toMatch(/cannot be changed/i);
    expect(where).toContain("wrangler d1 create dcc-web-contact --location wnam");
    expect(where).toContain("wrangler d1 create dcc-web-contact-preview --location wnam");
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
    // Items 1-9 and 19-24 are before-merge, 10-18 and 25 are after-merge (plan.md walkthrough order).
    const beforeMerge = setupItems.filter((i) => i.order <= 9 || (i.order >= 19 && i.order <= 24) || i.order === 26);
    const afterMerge = setupItems.filter((i) => (i.order >= 10 && i.order <= 18) || i.order === 25 || i.order === 27);
    expect(beforeMerge.every((i) => i.phase === "before-merge")).toBe(true);
    expect(afterMerge.every((i) => i.phase === "after-merge")).toBe(true);
  });
});

describe("package.json scripts for the launch (T002)", () => {
  it("has a site:check script that runs the site check CLI, with no new dependency", () => {
    const pkg = JSON.parse(readFileSync(fileURLToPath(new URL("../../../package.json", import.meta.url)), "utf-8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["site:check"]).toBe("node scripts/site-check/cli.ts");
  });
});
