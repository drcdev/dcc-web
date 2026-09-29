// Unit tests for the pre-paint theme script src/scripts/theme-init.js
// (contracts/theme.md "Pre-paint script"; research R5; FR-013, FR-015).
// The script is run in a fresh V8 context with a stubbed document,
// localStorage and matchMedia, exactly as the browser would run the inline
// <script> in <head>.
import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const scriptPath = fileURLToPath(new URL("../../../src/scripts/theme-init.js", import.meta.url));

function readScript(): string {
  return readFileSync(scriptPath, "utf-8");
}

type StorageMode =
  | { kind: "value"; value: string | null }
  | { kind: "throws-on-access" }
  | { kind: "throws-on-read" };

interface RunOptions {
  storage: StorageMode;
  prefersDark?: boolean;
  initialClasses?: string[];
  noMatchMedia?: boolean;
}

function run({ storage, prefersDark = false, initialClasses = ["dark"], noMatchMedia }: RunOptions) {
  const classes = new Set(initialClasses);
  const writes: [string, string][] = [];
  const mediaQueries: string[] = [];

  const classList = {
    add: (...names: string[]) => names.forEach((n) => classes.add(n)),
    remove: (...names: string[]) => names.forEach((n) => classes.delete(n)),
    toggle: (name: string, force?: boolean) => {
      const on = force ?? !classes.has(name);
      if (on) classes.add(name);
      else classes.delete(name);
      return on;
    },
    contains: (name: string) => classes.has(name),
  };
  const document = { documentElement: { classList, className: "" } };

  const storageObject = {
    getItem: (key: string) => {
      if (storage.kind === "throws-on-read") throw new Error("SecurityError");
      return key === "color-theme" && storage.kind === "value" ? storage.value : null;
    },
    setItem: (key: string, value: string) => {
      writes.push([key, value]);
    },
    removeItem: () => {},
  };

  const context: Record<string, unknown> = { document };
  Object.defineProperty(context, "localStorage", {
    get() {
      if (storage.kind === "throws-on-access") throw new Error("SecurityError");
      return storageObject;
    },
  });
  if (!noMatchMedia) {
    context.matchMedia = (query: string) => {
      mediaQueries.push(query);
      return { matches: query === "(prefers-color-scheme: dark)" ? prefersDark : false };
    };
  }
  context.window = context;

  let error: unknown = null;
  try {
    runInNewContext(readScript(), context);
  } catch (e) {
    error = e;
  }
  return { classes, writes, mediaQueries, error };
}

describe("theme-init.js", () => {
  it("adds js to <html>", () => {
    const { classes, error } = run({ storage: { kind: "value", value: null }, initialClasses: ["dark"] });
    expect(error).toBeNull();
    expect(classes.has("js")).toBe(true);
  });

  it("keeps other classes on <html>", () => {
    const { classes } = run({
      storage: { kind: "value", value: "light" },
      initialClasses: ["dark", "motion-safe:scroll-smooth"],
    });
    expect(classes.has("motion-safe:scroll-smooth")).toBe(true);
  });

  it("is dark with no stored choice, whatever the device prefers", () => {
    for (const prefersDark of [true, false]) {
      const { classes, error } = run({ storage: { kind: "value", value: null }, prefersDark });
      expect(error).toBeNull();
      expect(classes.has("dark")).toBe(true);
    }
  });

  it("applies a stored dark choice", () => {
    const { classes } = run({ storage: { kind: "value", value: "dark" }, initialClasses: [] });
    expect(classes.has("dark")).toBe(true);
  });

  it("applies a stored light choice by removing dark", () => {
    const { classes } = run({ storage: { kind: "value", value: "light" }, prefersDark: true });
    expect(classes.has("dark")).toBe(false);
  });

  it("resolves system through prefers-color-scheme: dark", () => {
    const dark = run({ storage: { kind: "value", value: "system" }, prefersDark: true });
    expect(dark.classes.has("dark")).toBe(true);
    expect(dark.mediaQueries).toContain("(prefers-color-scheme: dark)");

    const light = run({ storage: { kind: "value", value: "system" }, prefersDark: false });
    expect(light.classes.has("dark")).toBe(false);
  });

  it.each(["garbage", "Light", "", "auto"])("treats unrecognised value %j as dark", (value) => {
    const { classes, error } = run({ storage: { kind: "value", value }, initialClasses: [] });
    expect(error).toBeNull();
    expect(classes.has("dark")).toBe(true);
  });

  it("treats a localStorage that throws on access as dark, without throwing", () => {
    const { classes, error } = run({ storage: { kind: "throws-on-access" }, initialClasses: [] });
    expect(error).toBeNull();
    expect(classes.has("dark")).toBe(true);
    expect(classes.has("js")).toBe(true);
  });

  it("treats a localStorage that throws on read as dark, without throwing", () => {
    const { classes, error } = run({ storage: { kind: "throws-on-read" }, initialClasses: [] });
    expect(error).toBeNull();
    expect(classes.has("dark")).toBe(true);
  });

  it("does not throw when matchMedia is unavailable in system mode", () => {
    const { error, classes } = run({ storage: { kind: "value", value: "system" }, noMatchMedia: true });
    expect(error).toBeNull();
    expect(classes.has("js")).toBe(true);
  });

  it("never writes storage (first visit or otherwise)", () => {
    for (const value of [null, "dark", "light", "system", "garbage"]) {
      const { writes } = run({ storage: { kind: "value", value } });
      expect(writes).toEqual([]);
    }
  });

  it("is at most 1 KB", () => {
    expect(statSync(scriptPath).size).toBeLessThanOrEqual(1024);
  });

  it("uses no network API", () => {
    const source = readScript();
    for (const forbidden of [
      "fetch",
      "XMLHttpRequest",
      "sendBeacon",
      "WebSocket",
      "EventSource",
      "import(",
      "http:",
      "https:",
      "createElement",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
