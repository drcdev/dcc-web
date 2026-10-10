import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpReader } from "../../../../scripts/setup-check/providers/http.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

function fetchFailure(code: string, message = "fetch failed"): Error {
  return Object.assign(new TypeError(message), { cause: Object.assign(new Error(code), { code }) });
}

async function failureOf(url: string): Promise<ProviderAccessError> {
  const error = await createHttpReader()
    .get(url)
    .catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ProviderAccessError);
  return error as ProviderAccessError;
}

describe("providers/http.ts manual redirects (T005)", () => {
  it("follows redirects by default", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await createHttpReader().get("https://doncoleman.ca/");
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ redirect: "follow" });
  });

  it("with { redirect: 'manual' } returns the redirect status and the raw Location header", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 301, headers: { location: "https://doncoleman.ca/about/?check=1" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await createHttpReader().get("https://www.doncoleman.ca/about/?check=1", { redirect: "manual" });
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: "GET", redirect: "manual" });
    expect(response.status).toBe(301);
    expect(response.headers.location).toBe("https://doncoleman.ca/about/?check=1");
  });
});

describe("providers/http.ts error classification (T005)", () => {
  it.each([
    "ERR_TLS_CERT_ALTNAME_INVALID",
    "ERR_SSL_WRONG_VERSION_NUMBER",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "CERT_HAS_EXPIRED",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "EPROTO",
  ])("surfaces %s as kind tls", async (code) => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(fetchFailure(code))));
    expect((await failureOf("https://doncoleman.ca/")).kind).toBe("tls");
  });

  it("surfaces a reset during the TLS handshake as kind tls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.reject(fetchFailure("ECONNRESET", "Client network socket disconnected before secure TLS connection was established")),
      ),
    );
    expect((await failureOf("https://doncoleman.ca/")).kind).toBe("tls");
  });

  it("surfaces other failures as kind network, and an abort as kind timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(fetchFailure("ENOTFOUND"))));
    expect((await failureOf("https://doncoleman.ca/")).kind).toBe("network");

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    expect((await failureOf("https://doncoleman.ca/")).kind).toBe("timeout");
  });
});
