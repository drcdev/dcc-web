import { describe, expect, it } from "vitest";
import { isSameOriginRequest, isSecureRequest } from "../src/same-origin";

describe("isSecureRequest", () => {
  it.each(["https://example.com/api/x", "http://localhost:4321/api/x", "http://127.0.0.1:4321/api/x"])("accepts %s", (url) => {
    expect(isSecureRequest(new URL(url))).toBe(true);
  });

  it.each(["http://example.com/api/x", "http://localhost.evil.example/api/x"])("refuses %s", (url) => {
    expect(isSecureRequest(new URL(url))).toBe(false);
  });
});

function req(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { method: "POST", headers });
}

function check(url: string, headers: Record<string, string> = {}) {
  return isSameOriginRequest(req(url, headers), new URL(url));
}

describe("isSameOriginRequest", () => {
  it("accepts an https request whose Origin matches", () => {
    expect(check("https://example.com/api/x", { Origin: "https://example.com" })).toBe(true);
  });

  it("accepts Sec-Fetch-Site same-origin and an absent Sec-Fetch-Site", () => {
    expect(check("https://example.com/api/x", { Origin: "https://example.com", "Sec-Fetch-Site": "same-origin" })).toBe(true);
  });

  it("refuses a missing Origin", () => {
    expect(check("https://example.com/api/x")).toBe(false);
  });

  it("refuses a different Origin", () => {
    expect(check("https://example.com/api/x", { Origin: "https://evil.example" })).toBe(false);
  });

  it.each(["same-site", "cross-site", "none"])("refuses Sec-Fetch-Site %s", (site) => {
    expect(check("https://example.com/api/x", { Origin: "https://example.com", "Sec-Fetch-Site": site })).toBe(false);
  });

  it("refuses plain http on a public host", () => {
    expect(check("http://example.com/api/x", { Origin: "http://example.com" })).toBe(false);
  });

  it.each(["localhost", "127.0.0.1"])("accepts plain http on %s", (host) => {
    expect(check(`http://${host}:4321/api/x`, { Origin: `http://${host}:4321` })).toBe(true);
  });
});
