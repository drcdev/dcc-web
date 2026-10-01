import { describe, expect, it } from "vitest";
import { createDnsReader, type ResolverLike } from "../../../../scripts/setup-check/providers/dns.ts";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";

function resolverFor(server: string, answers: Record<string, string[] | Error>): ResolverLike {
  return {
    resolve4: async (name: string) => {
      const answer = answers[`${server}:${name}`];
      if (answer instanceof Error) throw answer;
      if (!answer) throw Object.assign(new Error("queryA ENODATA"), { code: "ENODATA" });
      return answer;
    },
  } as unknown as ResolverLike;
}

describe("providers/dns.ts resolveEach (T005)", () => {
  it("returns the 1.1.1.1 and 8.8.8.8 answers separately, in that order", async () => {
    const reader = createDnsReader(["1.1.1.1", "8.8.8.8"], (server) =>
      resolverFor(server, {
        "1.1.1.1:doncoleman.ca": ["192.0.2.1"],
        "8.8.8.8:doncoleman.ca": ["49.13.201.194"],
      }),
    );
    const each = await reader.resolveEach("doncoleman.ca", "A");
    expect(each).toEqual([
      { resolver: "1.1.1.1", answers: [{ type: "A", name: "doncoleman.ca", value: "192.0.2.1" }] },
      { resolver: "8.8.8.8", answers: [{ type: "A", name: "doncoleman.ca", value: "49.13.201.194" }] },
    ]);
  });

  it("gives an empty answer list for a resolver with no data, without failing the other", async () => {
    const reader = createDnsReader(["1.1.1.1", "8.8.8.8"], (server) =>
      resolverFor(server, { "1.1.1.1:doncoleman.ca": ["192.0.2.1"] }),
    );
    const each = await reader.resolveEach("doncoleman.ca", "A");
    expect(each[0]!.answers).toHaveLength(1);
    expect(each[1]).toEqual({ resolver: "8.8.8.8", answers: [] });
  });

  it("throws a ProviderAccessError when a resolver fails for another reason", async () => {
    const reader = createDnsReader(["1.1.1.1", "8.8.8.8"], (server) =>
      resolverFor(server, {
        "1.1.1.1:doncoleman.ca": ["192.0.2.1"],
        "8.8.8.8:doncoleman.ca": Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" }),
      }),
    );
    await expect(reader.resolveEach("doncoleman.ca", "A")).rejects.toBeInstanceOf(ProviderAccessError);
  });
});
