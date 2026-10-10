import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { filesUnder } from "../../helpers/files.ts";

const docPath = fileURLToPath(
  new URL("../../../docs/design-source.md", import.meta.url),
);
const gitignorePath = fileURLToPath(new URL("../../../.gitignore", import.meta.url));
const srcDir = fileURLToPath(new URL("../../../src", import.meta.url));

function readDoc(): string {
  return readFileSync(docPath, "utf-8");
}

function listFilesRecursive(dir: string): string[] {
  return existsSync(dir) ? filesUnder(dir) : [];
}

describe("docs/design-source.md", () => {
  it("exists", () => {
    expect(existsSync(docPath)).toBe(true);
  });

  const doc = existsSync(docPath) ? readDoc() : "";

  it("has the three required headings", () => {
    expect(doc).toMatch(/#{1,6}\s*How to get Flux/);
    expect(doc).toMatch(/#{1,6}\s*Mapping/);
    expect(doc).toMatch(/#{1,6}\s*Accessibility adjustments/);
  });

  it("describes the current design source, not the Ghost or Supabase setup it came from", () => {
    expect(doc).not.toMatch(/ghost/i);
    expect(doc).not.toMatch(/supabase/i);
  });

  it("How to get Flux: contains the clone command and read-only/gitignored/never imported language", () => {
    expect(doc).toContain("gh repo clone drcdev/flux .reference/flux -- --depth 1");
    expect(doc.toLowerCase()).toContain("read-only");
    expect(doc.toLowerCase()).toContain("gitignored");
    expect(doc.toLowerCase()).toContain("never imported");
  });

  it("Mapping: has a table with the required columns", () => {
    expect(doc).toMatch(/\|\s*Flux part\s*\|\s*Becomes\s*\|\s*Owner\s*\|/);
  });

  function getMappingDataRows(): string[] {
    const allLines = doc.split("\n");
    const headerIndex = allLines.findIndex((line) =>
      /\|\s*Flux part\s*\|\s*Becomes\s*\|\s*Owner\s*\|/.test(line),
    );
    expect(headerIndex).toBeGreaterThan(-1);
    // headerIndex = header row, headerIndex + 1 = separator row, rest = data rows
    const rest = allLines.slice(headerIndex + 2);
    const dataRows: string[] = [];
    for (const line of rest) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|")) break;
      if ((trimmed.match(/\|/g) ?? []).length >= 3) dataRows.push(trimmed);
    }
    return dataRows;
  }

  it("Mapping: has 19 mapping rows", () => {
    expect(getMappingDataRows().length).toBe(19);
  });

  it("Mapping: every owner is one of the allowed values", () => {
    const dataRows = getMappingDataRows();
    const allowedOwners = [
      "Foundation",
      "Pages",
      "Blog",
      "Portfolio",
      "Contact",
      "Each feature",
    ];
    for (const row of dataRows) {
      const cells = row.split("|").map((c) => c.trim());
      const owner = cells[cells.length - 2] ?? "";
      const matchesAllowed = allowedOwners.some((allowed) => owner.includes(allowed));
      expect(matchesAllowed, `Row owner cell "${owner}" should include an allowed owner`).toBe(
        true,
      );
    }
  });

  const requiredFluxNames = [
    "theme-toggle.js",
    "ui-theme-toggle.hbs",
    "layout-author-hero.hbs",
    "ui-share.hbs",
    "error.hbs",
    "table-wrapper.js",
    "kg-width-wide",
    "content-feature-image.hbs",
    "ui-contact-form.hbs",
    "contact-form.js",
    "default.hbs",
    "layout-header.hbs",
    "layout-footer.hbs",
    "navigation.hbs",
    "navigation-toggle.js",
    "partials/Icons",
    "page.hbs",
    "content-section.hbs",
    "post.hbs",
    "content-post-list.hbs",
    "content-post-list-featured.hbs",
    "content-post-meta.hbs",
    "ui-tag-pill.hbs",
    "kg-code-card",
    "#d68844",
    "dusk",
    "rust",
    "sage",
    "lavender",
    "mist",
    "sand",
    "mauve",
  ];

  it.each(requiredFluxNames)("Mapping: mentions Flux name %s verbatim", (name) => {
    expect(doc).toContain(name);
  });

  it("Accessibility adjustments: section has content (may be 'None')", () => {
    const match = doc.match(/#{1,6}\s*Accessibility adjustments\s*\n+([\s\S]*)$/);
    expect(match).not.toBeNull();
    expect(match![1].trim().length).toBeGreaterThan(0);
  });
  // Phase 9 (T087) found failing Flux pairings, so the section must now record
  // each one: pairing, where used, failing ratio, replacement shade and its
  // ratio (FR-001a).
  function getAdjustmentRows(): string[] {
    const section = doc.match(/#{1,6}\s*Accessibility adjustments\s*\n+([\s\S]*)$/)?.[1] ?? "";
    return section
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("|") && !/^\|[\s|:-]+\|$/.test(l))
      .slice(1);
  }

  it("Accessibility adjustments: has a table naming pairing, where used, failing ratio and replacement", () => {
    expect(doc).toMatch(
      /\|\s*Pairing\s*\|\s*Where used\s*\|\s*Failing ratio\s*\|\s*Replacement\s*\|\s*New ratio\s*\|/,
    );
  });

  it("Accessibility adjustments: records the footer copyright mauve-500 → mauve-600 change", () => {
    const rows = getAdjustmentRows();
    expect(rows.length).toBeGreaterThan(0);
    const row = rows.find((r) => r.includes("mauve-500") && r.includes("mauve-600"));
    expect(row, "mauve-500 → mauve-600 row").toBeDefined();
    expect(row).toMatch(/4\.19:1/);
    expect(row).toMatch(/6\.01:1/);
  });

  it("Accessibility adjustments: every row states two ratios in N.NN:1 form", () => {
    for (const row of getAdjustmentRows()) {
      expect((row.match(/\d+\.\d{2}:1/g) ?? []).length, row).toBeGreaterThanOrEqual(2);
    }
  });
});

describe(".gitignore and src/ have no .reference leakage", () => {
  it(".gitignore contains .reference/", () => {
    const gitignore = readFileSync(gitignorePath, "utf-8");
    expect(gitignore).toContain(".reference/");
  });

  it("no file under src/ contains the string .reference", () => {
    const files = listFilesRecursive(srcDir);
    const offenders: string[] = [];
    for (const file of files) {
      const contents = readFileSync(file, "utf-8");
      if (contents.includes(".reference")) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
