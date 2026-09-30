import { describe, expect, it } from "vitest";
import { hashIp } from "../src/contact/ip-hash";

describe("hashIp", () => {
  it("matches the HMAC-SHA-256 known vector", async () => {
    // openssl dgst -sha256 -hmac test-salt over "203.0.113.7"
    expect(await hashIp("203.0.113.7", "test-salt")).toBe(
      "edc4431122917ee953948596ea251ed7b01ed2324867bf8fc29998b8c2eecdbc",
    );
  });

  it("is 64 lowercase hex characters", async () => {
    expect(await hashIp("198.51.100.1", "test-salt")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs under a different salt", async () => {
    expect(await hashIp("203.0.113.7", "other-salt")).not.toBe(await hashIp("203.0.113.7", "test-salt"));
  });
});
