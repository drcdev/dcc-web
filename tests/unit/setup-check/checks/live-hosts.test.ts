// Setup item 18 "live-hosts" (spec 034, contracts/setup-check.md): recorded responses only, no network.
import { describe, expect, it, vi } from "vitest";
import { check, GHOST_PROBE } from "../../../../scripts/setup-check/checks/live-hosts.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import type { HttpResponseSummary } from "../../../../scripts/setup-check/types.ts";
import { fakeProviderContext } from "./test-helpers.ts";

const WWW = "https://www.doncoleman.ca";
const BARE = "https://doncoleman.ca";
const CANONICAL = `<link rel="canonical" href="${WWW}/">`;
const CONFIG = { owner: "drcdev", repo: "dcc-web", zone: "doncoleman.ca", workerName: "dcc-web" };

type Reply = HttpResponseSummary | Error;
const HSTS = "max-age=15552000; includeSubDomains";
const HSTS_HEADER = "strict-transport-security";
// HTTPS replies carry the zone HSTS header by default; `bare()` strips it for a case that must lack it.
const page = (body = `<html><head>${CANONICAL}</head></html>`): Reply => ({ status: 200, headers: { [HSTS_HEADER]: HSTS }, body });
const redirect = (location: string, status = 301): Reply => ({ status, headers: { location, [HSTS_HEADER]: HSTS }, body: "" });
const withHsts = (reply: Reply, value: string): Reply =>
  reply instanceof Error ? reply : { ...reply, headers: { ...reply.headers, [HSTS_HEADER]: value } };
const bare = (reply: Reply): Reply => {
  if (reply instanceof Error) return reply;
  const { [HSTS_HEADER]: _drop, ...headers } = reply.headers;
  return { ...reply, headers };
};

const PATHS = ["/", "/writing/?page=2"];
const ghostEnd = `${WWW}${GHOST_PROBE.to}`;

/** The correct arrangement: www serves, everything else answers 301 to www with path and query kept. */
function newArrangement(): Map<string, Reply> {
  const r = new Map<string, Reply>();
  for (const p of PATHS) {
    r.set(`${WWW}${p}`, page());
    r.set(`http://www.doncoleman.ca${p}`, redirect(`${WWW}${p}`));
    r.set(`${BARE}${p}`, redirect(`${WWW}${p}`));
    r.set(`http://doncoleman.ca${p}`, redirect(`${WWW}${p}`));
  }
  r.set(`${WWW}${GHOST_PROBE.from}`, redirect(ghostEnd));
  r.set(`${BARE}${GHOST_PROBE.from}`, redirect(`${WWW}${GHOST_PROBE.from}`));
  r.set(ghostEnd, page());
  // Cloudflare sends HSTS on HTTPS only; plain http replies carry none.
  for (const [url, reply] of r) if (url.startsWith("http://")) r.set(url, bare(reply));
  return r;
}

function run(replies: Map<string, Reply>) {
  const calls: Array<{ url: string; options: unknown }> = [];
  const get = vi.fn(async (url: string, options?: unknown) => {
    calls.push({ url, options });
    const reply = replies.get(url);
    if (!reply) throw new Error(`unexpected request: ${url}`);
    if (reply instanceof Error) throw reply;
    return reply;
  });
  const ctx = fakeProviderContext({
    http: { get: get as never },
    fs: { readJson: ((path: string) => (path === "setup/config.json" ? CONFIG : null)) as never },
  });
  return check(ctx).then((result) => ({ result, calls }));
}

function with_(edit: (r: Map<string, Reply>) => void): Map<string, Reply> {
  const r = newArrangement();
  edit(r);
  return r;
}

describe("checks/live-hosts", () => {
  it("is complete when all ten probes pass", async () => {
    const { result } = await run(newArrangement());
    expect(result.status).toBe("complete");
    expect(result.nextAction).toBeNull();
  });

  it("accepts the two-hop http bare chain through https with the same path and query", async () => {
    const { result } = await run(
      with_((r) => {
        for (const p of PATHS) r.set(`http://doncoleman.ca${p}`, redirect(`${BARE}${p}`));
      }),
    );
    expect(result.status).toBe("complete");
  });

  it("accepts a two-hop Ghost chain from the bare host", async () => {
    const { result } = await run(
      with_((r) => {
        r.set(`${BARE}${GHOST_PROBE.from}`, redirect(`${BARE}${GHOST_PROBE.to}`));
        r.set(`${BARE}${GHOST_PROBE.to}`, redirect(ghostEnd));
      }),
    );
    expect(result.status).toBe("complete");
  });

  it("accepts any positive max-age and a lower-case includeSubDomains", async () => {
    for (const value of ["max-age=31536000; includeSubDomains", "max-age=15552000; includesubdomains"]) {
      const { result } = await run(with_((r) => r.set(`${WWW}/`, withHsts(page(), value))));
      expect(result.status).toBe("complete");
    }
  });

  it("neither requires nor rejects HSTS on a plain http reply", async () => {
    const { result } = await run(
      with_((r) => r.set("http://www.doncoleman.ca/", withHsts(redirect(`${WWW}/`), HSTS))),
    );
    expect(result.status).toBe("complete");
  });

  it("requests manually, once per hop, with no retry and no credentials", async () => {
    const { calls } = await run(newArrangement());
    expect(calls.length).toBeLessThanOrEqual(40);
    for (const c of calls) {
      expect(c.options).toEqual({ redirect: "manual" });
    }
  });

  it("is pending when the www certificate is not issued yet", async () => {
    const { result } = await run(
      with_((r) => r.set(`${WWW}/`, new ProviderAccessError("handshake failed", "tls"))),
    );
    expect(result.status).toBe("pending");
    expect(result.nextAction).toMatch(/run the check again/i);
  });

  it("is missing, not pending, for a certificate failure on the bare domain", async () => {
    const { result } = await run(
      with_((r) => r.set(`${BARE}/`, new ProviderAccessError("handshake failed", "tls"))),
    );
    expect(result.status).toBe("missing");
  });

  it("is could-not-check on a timeout or network failure", async () => {
    for (const kind of ["timeout", "network"] as const) {
      const { result } = await run(with_((r) => r.set(`${WWW}/`, new ProviderAccessError("boom", kind))));
      expect(result.status).toBe("could-not-check");
      expect(result.nextAction).toMatch(/network connection/i);
    }
  });

  describe("is missing, with the broken rule in the details", () => {
    const cases: Array<[string, (r: Map<string, Reply>) => void, RegExp]> = [
      [
        "the old arrangement (www redirects to bare, bare serves)",
        (r) => {
          for (const p of PATHS) {
            r.set(`${WWW}${p}`, redirect(`${BARE}${p}`));
            r.set(`${BARE}${p}`, page(`<link rel="canonical" href="${BARE}/">`));
          }
        },
        /expected/i,
      ],
      [
        "www serves but the bare domain still serves",
        (r) => r.set(`${BARE}/`, page()),
        /redirect|expected/i,
      ],
      ["bare redirects to a different path", (r) => { r.set(`${BARE}/`, redirect(`${WWW}/other/`)); r.set(`${WWW}/other/`, page()); }, /path|expected/i],
      ["bare drops the query", (r) => { r.set(`${BARE}/writing/?page=2`, redirect(`${WWW}/writing/`)); r.set(`${WWW}/writing/`, page()); }, /query/i],
      ["bare uses a 302", (r) => r.set(`${BARE}/`, redirect(`${WWW}/`, 302)), /302.*expected 301/i],
      [
        "bare takes two https hops",
        (r) => {
          r.set(`${BARE}/`, redirect(`${BARE}/x/`));
          r.set(`${BARE}/x/`, redirect(`${WWW}/`));
        },
        /expected/i,
      ],
      [
        "a two-hop http chain through a wrong middle URL",
        (r) => {
          r.set("http://doncoleman.ca/", redirect(`${BARE}/other/`));
          r.set(`${BARE}/other/`, redirect(`${WWW}/`));
        },
        /expected|path changed/i,
      ],
      [
        "a loop between bare and www",
        (r) => {
          r.set(`${BARE}/`, redirect(`${WWW}/`));
          r.set(`${WWW}/`, redirect(`${BARE}/`));
        },
        /more than 3 redirects|loop/i,
      ],
      ["http://www is not redirected", (r) => r.set("http://www.doncoleman.ca/", page()), /expected/i],
      ["a 200 without the site's canonical", (r) => r.set(`${WWW}/`, page("<html>nothing</html>")), /canonical/i],
      [
        "a redirect to a foreign host (not followed)",
        (r) => r.set(`${BARE}/`, redirect("https://example.com/")),
        /example\.com/,
      ],
      ["www final 200 without HSTS", (r) => r.set(`${WWW}/`, bare(page())), /Strict-Transport-Security|HSTS/i],
      [
        "www final 200 with HSTS but no includeSubDomains",
        (r) => r.set(`${WWW}/`, withHsts(page(), "max-age=15552000")),
        /Strict-Transport-Security|HSTS/i,
      ],
      [
        "bare https 301 without HSTS",
        (r) => r.set(`${BARE}/`, bare(redirect(`${WWW}/`))),
        /Strict-Transport-Security|HSTS/i,
      ],
      [
        "www Ghost 301 without HSTS",
        (r) => r.set(`${WWW}${GHOST_PROBE.from}`, bare(redirect(ghostEnd))),
        /Strict-Transport-Security|HSTS/i,
      ],
      [
        "HSTS with max-age=0",
        (r) => r.set(`${WWW}/`, withHsts(page(), "max-age=0; includeSubDomains")),
        /Strict-Transport-Security|HSTS/i,
      ],
    ];
    it.each(cases)("%s", async (_name, edit, rule) => {
      const { result, calls } = await run(with_(edit));
      expect(result.status).toBe("missing");
      expect(result.details.join("\n")).toMatch(rule);
      expect(calls.some((c) => c.url.startsWith("https://example.com"))).toBe(false);
    });
  });

  it("follows at most three redirects", async () => {
    const { result, calls } = await run(
      with_((r) => {
        r.set(`${BARE}/`, redirect(`${BARE}/a`));
        r.set(`${BARE}/a`, redirect(`${BARE}/b`));
        r.set(`${BARE}/b`, redirect(`${BARE}/c`));
        r.set(`${BARE}/c`, redirect(`${BARE}/d`));
        r.set(`${BARE}/d`, page());
      }),
    );
    expect(result.status).toBe("missing");
    expect(calls.some((c) => c.url === `${BARE}/d`)).toBe(false);
  });

  it("names the start URL and each hop's status and Location in a failing probe's detail", async () => {
    const { result } = await run(with_((r) => r.set(`${BARE}/`, redirect(`${WWW}/`, 302))));
    const detail = result.details.join("\n");
    expect(detail).toContain(`${BARE}/`);
    expect(detail).toContain("302");
    expect(detail).toContain(`${WWW}/`);
  });
});
