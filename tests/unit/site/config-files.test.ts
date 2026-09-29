import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function stripJsonComments(text: string): string {
  // Strip // line comments and /* */ block comments outside of strings.
  let result = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        result += char;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      result += char;
      if (char === "\\") {
        result += next;
        i++;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    result += char;
  }
  return result;
}

describe("wrangler.jsonc", () => {
  const wranglerPath = fileURLToPath(new URL("../../../wrangler.jsonc", import.meta.url));
  const config = JSON.parse(stripJsonComments(readFileSync(wranglerPath, "utf-8")));

  it("names the worker dcc-web", () => {
    expect(config.name).toBe("dcc-web");
  });

  it("serves static assets from ./dist", () => {
    expect(config.assets?.directory).toBe("./dist");
  });

  it("enables workers_dev and preview_urls", () => {
    expect(config.workers_dev).toBe(true);
    expect(config.preview_urls).toBe(true);
  });

  it("has no main script and no vars or secrets", () => {
    expect(config.main).toBeUndefined();
    expect(config.vars).toBeUndefined();
    expect(config.secrets).toBeUndefined();
  });
});

describe(".env.example", () => {
  const envExamplePath = fileURLToPath(new URL("../../../.env.example", import.meta.url));
  const contents = readFileSync(envExamplePath, "utf-8");
  const lines = contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  it("contains only comment lines and NAME= lines with empty values", () => {
    for (const line of lines) {
      expect(line.startsWith("#") || /^[A-Z0-9_]+=$/.test(line)).toBe(true);
    }
  });

  it("lists exactly CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN", () => {
    const names = lines
      .filter((line) => !line.startsWith("#"))
      .map((line) => line.replace(/=$/, ""));
    expect(new Set(names)).toEqual(
      new Set(["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN"]),
    );
  });
});
