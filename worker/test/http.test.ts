// The shared body reader and JSON-object parser in worker/src/http.ts.
import { describe, expect, it } from "vitest";
import { parseJsonObject, readCapped } from "../src/http";

const post = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request("https://example.test/api/x", { method: "POST", body, headers });

/** A request whose body is a stream; `pulled()` says whether anything read from it. */
function streamed(chunks: Uint8Array[], headers: Record<string, string> = {}) {
  let pulled = false;
  let i = 0;
  // highWaterMark 0: no pull until a reader asks, so `pulled()` only reflects real reads.
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        pulled = true;
        if (i < chunks.length) controller.enqueue(chunks[i++]);
        else controller.close();
      },
    },
    { highWaterMark: 0 },
  );
  const request = new Request("https://example.test/api/x", {
    method: "POST",
    body,
    headers,
    // @ts-expect-error duplex is required for stream bodies in the Workers runtime
    duplex: "half",
  });
  return { request, pulled: () => pulled };
}

describe("readCapped", () => {
  it("returns the text when the body is under the cap", async () => {
    expect(await readCapped(post("hello"), 10)).toBe("hello");
  });

  it("accepts a body of exactly the cap", async () => {
    expect(await readCapped(post("12345"), 5)).toBe("12345");
  });

  it("returns an empty string when there is no body", async () => {
    expect(await readCapped(new Request("https://example.test/api/x", { method: "POST" }), 10)).toBe("");
  });

  it("returns null for a declared length over the cap without reading the stream", async () => {
    const { request, pulled } = streamed([new Uint8Array(4)], { "Content-Length": "2048" });
    expect(await readCapped(request, 1024)).toBeNull();
    expect(pulled()).toBe(false);
  });

  it("returns null when a stream with no declared length grows past the cap", async () => {
    const { request } = streamed([new Uint8Array(6), new Uint8Array(6)]);
    expect(await readCapped(request, 10)).toBeNull();
  });
});

describe("parseJsonObject", () => {
  it("returns the object for a JSON object", () => {
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it.each(["[1]", "null", '"x"', "1", "not json", ""])("returns null for %j", (raw) => {
    expect(parseJsonObject(raw)).toBeNull();
  });
});
