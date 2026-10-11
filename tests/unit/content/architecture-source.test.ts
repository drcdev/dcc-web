// Source helpers: rows P03-P07 (assertPartSource, sourceUrl, assertPartBody) and P08-P09
// (checkParts), with neutral data in a temp folder (contracts/part-files.md).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { checkParts } from "../../../src/lib/architecture/check.ts";
import type { Layout } from "../../../src/lib/architecture/layout.ts";
import { assertPartBody, assertPartSource, sourceUrl } from "../../../src/lib/architecture/source.ts";
import { PageContentError } from "../../../src/lib/content/errors.ts";

const root = mkdtempSync(join(tmpdir(), "architecture-source-"));
mkdirSync(join(root, "folder", "inner"), { recursive: true });
writeFileSync(join(root, "folder", "file.ts"), "x");
afterAll(() => rmSync(root, { recursive: true, force: true }));

const FILE = "src/content/architecture/example.md";

describe("assertPartSource", () => {
  it("accepts a part with no source and an existing file or folder", () => {
    expect(() => assertPartSource(FILE, root, { name: "A" })).not.toThrow();
    expect(() => assertPartSource(FILE, root, { source: "folder/file.ts" })).not.toThrow();
    expect(() => assertPartSource(FILE, root, { source: "folder" })).not.toThrow();
  });

  it.each(["/folder/file.ts", "../outside.ts", "folder/../../outside.ts"])("P03: rejects %s", (source) => {
    expect(() => assertPartSource(FILE, root, { source })).toThrow(
      `Architecture part file ${FILE}: source "${source}" must be a path inside the repository, like worker/src/index.ts.`,
    );
    try {
      assertPartSource(FILE, root, { source });
    } catch (error) {
      expect(error).toBeInstanceOf(PageContentError);
    }
  });

  it("P04: rejects a path that does not exist", () => {
    expect(() => assertPartSource(FILE, root, { source: "folder/missing.ts" })).toThrow(
      `Architecture part file ${FILE}: source "folder/missing.ts" does not exist in the repository.`,
    );
  });
});

describe("sourceUrl", () => {
  it("P05: links a file under /blob/main/", () => {
    expect(sourceUrl(root, "folder/file.ts")).toBe("https://github.com/drcdev/dcc-web/blob/main/folder/file.ts");
  });
  it("P06: links a folder under /tree/main/ with no trailing slash", () => {
    expect(sourceUrl(root, "folder")).toBe("https://github.com/drcdev/dcc-web/tree/main/folder");
    expect(sourceUrl(root, "folder/")).toBe("https://github.com/drcdev/dcc-web/tree/main/folder");
  });
});

describe("assertPartBody", () => {
  it("P07: rejects an empty body", () => {
    expect(() => assertPartBody(FILE, " \n")).toThrow(
      `Architecture part file ${FILE}: the part has no explanation. Add a few sentences below the settings.`,
    );
    expect(() => assertPartBody(FILE, "Some words.")).not.toThrow();
  });
});

const layout = {
  viewBox: { width: 240, height: 100 },
  labelSizes: { part: 15, connection: 12.5 },
  parts: [
    { id: "one", kind: "box", x: 0, y: 0, width: 10, height: 10, lines: ["Part", "one"] },
    { id: "two", kind: "box", x: 0, y: 20, width: 10, height: 10, lines: ["Part two"] },
  ],
  connections: [],
} as unknown as Layout;

describe("checkParts", () => {
  it("accepts parts that match the layout", () => {
    expect(() => checkParts(layout, [{ id: "one", name: "Part one" }, { id: "two", name: "Part two" }])).not.toThrow();
  });

  it("P08: names extra and missing ids", () => {
    expect(() => checkParts(layout, [{ id: "one", name: "Part one" }, { id: "three", name: "Part three" }])).toThrow(
      PageContentError,
    );
    try {
      checkParts(layout, [{ id: "one", name: "Part one" }, { id: "three", name: "Part three" }]);
    } catch (error) {
      expect((error as Error).message).toContain("two");
      expect((error as Error).message).toContain("three");
    }
  });

  it("P09: names the id, the lines and the name when they differ", () => {
    try {
      checkParts(layout, [{ id: "one", name: "Something else" }, { id: "two", name: "Part two" }]);
      throw new Error("should have thrown");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("one");
      expect(message).toContain("Part one");
      expect(message).toContain("Something else");
    }
  });
});
