import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const docsPath = fileURLToPath(new URL("../../../docs/setup.md", import.meta.url));
const baselinePath = fileURLToPath(new URL("../../../setup/dns-baseline.json", import.meta.url));

function readDocs(): string {
  return readFileSync(docsPath, "utf-8");
}

function extractSection(markdown: string, id: string): string {
  const pattern = new RegExp(`^##\\s+.*\\{#${id}\\}\\s*$`, "m");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const start = match.index;
  const rest = markdown.slice(start + match[0].length);
  const nextHeading = /^##\s+/m.exec(rest);
  return rest.slice(0, nextHeading ? nextHeading.index : undefined);
}

describe("docs/setup.md DNS content", () => {
  it("contains a rollback procedure for the nameserver switch referencing the original Squarespace nameservers", () => {
    const section = extractSection(readDocs(), "dns-nameservers");
    expect(section.toLowerCase()).toContain("rollback");
    expect(section.toLowerCase()).toContain("squarespace");
    expect(section.toLowerCase()).toContain("original");
  });

  it("contains the TTL-is-informational-only instruction for imported records", () => {
    const section = extractSection(readDocs(), "dns-records-parity");
    expect(section.toLowerCase()).toContain("ttl");
    expect(section.toLowerCase()).toMatch(/informational/);
    expect(section.toLowerCase()).toMatch(/auto/);
  });

  it("contains the baseline-nameserver / delegated-subdomain-NS recording note", () => {
    const section = extractSection(readDocs(), "dns-records-parity");
    expect(section.toLowerCase()).toContain("nameserver");
    expect(section.toLowerCase()).toMatch(/delegat.*subdomain|subdomain.*ns/);
  });

  it("contains a DNSSEC pre-check before the nameserver switch", () => {
    const section = extractSection(readDocs(), "dns-nameservers").toLowerCase();
    expect(section).toContain("dnssec");
    expect(section).toContain("disabled");
    expect(section).toContain("squarespace");
  });

  it("lists the same original nameservers as setup/dns-baseline.json once it is filled in", () => {
    let baseline: { originalNameservers: string[] };
    try {
      baseline = JSON.parse(readFileSync(baselinePath, "utf-8")) as {
        originalNameservers: string[];
      };
    } catch {
      // setup/dns-baseline.json does not exist yet in Phase 1 (it is created
      // empty in Phase 2's T137); there is nothing to compare against yet.
      return;
    }
    if (baseline.originalNameservers.length === 0) {
      // Baseline starts empty (T137); Don fills it in during the walkthrough (T037).
      return;
    }
    const section = extractSection(readDocs(), "dns-nameservers");
    for (const ns of baseline.originalNameservers) {
      expect(section).toContain(ns);
    }
  });
});
