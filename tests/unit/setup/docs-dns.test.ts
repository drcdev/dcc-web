import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const docsPath = fileURLToPath(new URL("../../../docs/setup.md", import.meta.url));

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
});
