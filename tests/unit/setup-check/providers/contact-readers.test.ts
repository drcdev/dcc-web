import { describe, expect, it, vi } from "vitest";
import { ProviderAccessError } from "../../../../scripts/setup-check/types.ts";
import {
  APPLIED_MIGRATIONS_SQL,
  createCloudflareReader,
} from "../../../../scripts/setup-check/providers/cloudflare.ts";

const TOKEN = "cf-token-value";

async function* iterate<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) yield item;
}

class HttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

function reader(client: Record<string, unknown>) {
  return createCloudflareReader({ client: client as never, token: TOKEN });
}

describe("listD1Databases", () => {
  it("returns only uuid, name and region", async () => {
    const list = vi.fn(() =>
      iterate([{ uuid: "u1", name: "dcc-web", running_in_region: "WNAM", file_size: 5, secret: "leak", num_tables: 1 }]),
    );
    const result = await reader({ d1: { database: { list } } }).listD1Databases("acct", "dcc-web");
    expect(result).toEqual([{ uuid: "u1", name: "dcc-web", runningInRegion: "WNAM" }]);
    expect(list).toHaveBeenCalledWith({ account_id: "acct", name: "dcc-web" });
  });

  it("falls back to the per-database read when the list omits the region, and leaves it undefined when absent everywhere", async () => {
    const get = vi.fn(async (uuid: string) => (uuid === "u1" ? { uuid, running_in_region: "WNAM" } : { uuid }));
    const list = vi.fn(() =>
      iterate([
        { uuid: "u1", name: "dcc-web" },
        { uuid: "u2", name: "dcc-web-preview" },
      ]),
    );
    const result = await reader({ d1: { database: { list, get } } }).listD1Databases("acct");
    expect(result).toEqual([
      { uuid: "u1", name: "dcc-web", runningInRegion: "WNAM" },
      { uuid: "u2", name: "dcc-web-preview", runningInRegion: undefined },
    ]);
  });

  it("gives the permission hint on 403", async () => {
    const list = vi.fn(() => {
      throw new HttpError(403);
    });
    await expect(reader({ d1: { database: { list } } }).listD1Databases("acct")).rejects.toThrow(/D1: Read/);
  });
});

describe("listD1AppliedMigrations", () => {
  it("sends exactly the fixed SELECT and returns names only", async () => {
    const query = vi.fn(() => iterate([{ results: [{ name: "0001_create_messages.sql", id: 1 }], success: true }]));
    const result = await reader({ d1: { database: { query } } }).listD1AppliedMigrations("acct", "u1");
    expect(result).toEqual(["0001_create_messages.sql"]);
    expect(APPLIED_MIGRATIONS_SQL).toBe("SELECT name FROM d1_migrations ORDER BY id");
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith("u1", { account_id: "acct", sql: APPLIED_MIGRATIONS_SQL });
  });

  it("treats a missing d1_migrations table as no migrations applied", async () => {
    const query = vi.fn(() => {
      throw Object.assign(new Error("D1_ERROR: no such table: d1_migrations"), { status: 400 });
    });
    expect(await reader({ d1: { database: { query } } }).listD1AppliedMigrations("acct", "u1")).toEqual([]);
  });

  it("gives the permission hint on 403", async () => {
    const query = vi.fn(() => {
      throw new HttpError(403);
    });
    await expect(reader({ d1: { database: { query } } }).listD1AppliedMigrations("acct", "u1")).rejects.toThrow(
      /D1: Read/,
    );
  });
});

describe("listWorkerSecretNames", () => {
  it("returns names only, never a value", async () => {
    const list = vi.fn(() => iterate([{ name: "IP_HASH_SALT", type: "secret_text", text: "leaked-value" }]));
    const result = await reader({ workers: { scripts: { secrets: { list } } } }).listWorkerSecretNames(
      "acct",
      "dcc-web",
    );
    expect(result).toEqual(["IP_HASH_SALT"]);
    expect(JSON.stringify(result)).not.toContain("leaked-value");
  });

  it("returns [] for a Worker that does not exist and hints on 403", async () => {
    const missing = vi.fn(() => {
      throw new HttpError(404);
    });
    expect(
      await reader({ workers: { scripts: { secrets: { list: missing } } } }).listWorkerSecretNames("a", "x"),
    ).toEqual([]);
    const denied = vi.fn(() => {
      throw new HttpError(403);
    });
    await expect(
      reader({ workers: { scripts: { secrets: { list: denied } } } }).listWorkerSecretNames("a", "x"),
    ).rejects.toThrow(/Workers Scripts: Read/);
  });
});

describe("listWorkerCrons", () => {
  it("returns cron expressions", async () => {
    const get = vi.fn(async () => ({ schedules: [{ cron: "17 3 * * *", created_on: "x" }] }));
    expect(await reader({ workers: { scripts: { schedules: { get } } } }).listWorkerCrons("acct", "dcc-web")).toEqual([
      "17 3 * * *",
    ]);
    expect(get).toHaveBeenCalledWith("dcc-web", { account_id: "acct" });
  });

  it("returns [] for a Worker that does not exist and hints on 403", async () => {
    const missing = vi.fn(async () => {
      throw new HttpError(404);
    });
    expect(await reader({ workers: { scripts: { schedules: { get: missing } } } }).listWorkerCrons("a", "x")).toEqual(
      [],
    );
    const denied = vi.fn(async () => {
      throw new HttpError(403);
    });
    await expect(
      reader({ workers: { scripts: { schedules: { get: denied } } } }).listWorkerCrons("a", "x"),
    ).rejects.toThrow(/Workers Scripts: Read/);
  });
});

describe("listBuildTriggers", () => {
  const scripts = {
    list: vi.fn(() =>
      iterate([
        { id: "dcc-web-preview", tag: "tag123" },
        { id: "other", tag: "zzz" },
      ]),
    ),
  };

  it("resolves the Worker tag and keeps only the documented trigger fields", async () => {
    const get = vi.fn(async () => ({
      result: [
        {
          trigger_uuid: "t1",
          trigger_name: "Deploy default branch",
          branch_includes: ["main"],
          branch_excludes: [],
          build_command: "pnpm run build",
          deploy_command: "pnpm run deploy:preview",
          build_token_uuid: "secret-token-uuid",
          environment_variables: { PUBLIC_TURNSTILE_SITE_KEY: { value: "leaked" } },
        },
      ],
    }));
    const result = await reader({ workers: { scripts }, get }).listBuildTriggers("acct", "dcc-web-preview");
    expect(result).toEqual([
      {
        uuid: "t1",
        name: "Deploy default branch",
        branchIncludes: ["main"],
        branchExcludes: [],
        buildCommand: "pnpm run build",
        deployCommand: "pnpm run deploy:preview",
      },
    ]);
    expect(get).toHaveBeenCalledWith("/accounts/acct/builds/workers/tag123/triggers");
    expect(JSON.stringify(result)).not.toMatch(/leaked|secret-token/);
  });

  it("returns [] when the Worker is not in the account", async () => {
    const get = vi.fn();
    expect(await reader({ workers: { scripts }, get }).listBuildTriggers("acct", "nope")).toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });

  it("gives the permission hint on 403", async () => {
    const get = vi.fn(async () => {
      throw new HttpError(403);
    });
    await expect(reader({ workers: { scripts }, get }).listBuildTriggers("acct", "dcc-web-preview")).rejects.toThrow(
      /Workers Builds Configuration/,
    );
  });
});

describe("listBuildVariableNames", () => {
  it("returns keys only from an object map", async () => {
    const get = vi.fn(async () => ({
      result: { PUBLIC_TURNSTILE_SITE_KEY: { value: "leaked-site-key", is_secret: false }, OTHER: { value: "x" } },
    }));
    const result = await reader({ get }).listBuildVariableNames("acct", "t1");
    expect([...result].sort()).toEqual(["OTHER", "PUBLIC_TURNSTILE_SITE_KEY"]);
    expect(JSON.stringify(result)).not.toContain("leaked");
    expect(get).toHaveBeenCalledWith("/accounts/acct/builds/triggers/t1/environment_variables");
  });

  it("also accepts a list of named entries and an unwrapped body", async () => {
    const get = vi.fn(async () => [
      { key: "A", value: "v1" },
      { name: "B", value: "v2" },
    ]);
    expect([...(await reader({ get }).listBuildVariableNames("acct", "t1"))].sort()).toEqual(["A", "B"]);
  });

  it("gives the permission hint on 403", async () => {
    const get = vi.fn(async () => {
      throw new HttpError(403);
    });
    await expect(reader({ get }).listBuildVariableNames("acct", "t1")).rejects.toThrow(
      /Workers Builds Configuration/,
    );
  });
});

describe("listTurnstileWidgets", () => {
  it("drops sitekey and secret", async () => {
    const list = vi.fn(() =>
      iterate([
        { name: "dcc-web contact", domains: ["doncoleman.ca"], mode: "managed", sitekey: "0xSITE", secret: "0xSECRET" },
      ]),
    );
    const result = await reader({ turnstile: { widgets: { list } } }).listTurnstileWidgets("acct");
    expect(result).toEqual([{ name: "dcc-web contact", domains: ["doncoleman.ca"], mode: "managed" }]);
    expect(JSON.stringify(result)).not.toMatch(/0xSITE|0xSECRET|sitekey|secret/);
  });

  it("gives the permission hint on 403", async () => {
    const list = vi.fn(() => {
      throw new HttpError(403);
    });
    await expect(reader({ turnstile: { widgets: { list } } }).listTurnstileWidgets("acct")).rejects.toThrow(
      /Turnstile Sites: Read/,
    );
  });
});

describe("listEmailRoutingAddresses", () => {
  it("returns email and verified timestamp only, null when unverified", async () => {
    const list = vi.fn(() =>
      iterate([
        { email: "contact@doncoleman.ca", verified: "2026-10-10T12:00:00Z", tag: "t", id: "i" },
        { email: "other@example.com" },
      ]),
    );
    const result = await reader({ emailRouting: { addresses: { list } } }).listEmailRoutingAddresses("acct");
    expect(result).toEqual([
      { email: "contact@doncoleman.ca", verified: "2026-10-10T12:00:00Z" },
      { email: "other@example.com", verified: null },
    ]);
    expect(list).toHaveBeenCalledWith({ account_id: "acct" });
  });

  it("gives the permission hint on 403", async () => {
    const list = vi.fn(() => {
      throw new HttpError(403);
    });
    await expect(reader({ emailRouting: { addresses: { list } } }).listEmailRoutingAddresses("acct")).rejects.toThrow(
      /Email Routing Addresses: Read/,
    );
  });
});

describe("getEmailRoutingSettings", () => {
  it("returns only enabled and status for the zone", async () => {
    const get = vi.fn(async () => ({ id: "x", tag: "t", name: "drc.dev", enabled: true, status: "ready", skip_wizard: true }));
    const result = await reader({ emailRouting: { get } }).getEmailRoutingSettings("zone-drc");
    expect(result).toEqual({ enabled: true, status: "ready" });
    expect(get).toHaveBeenCalledWith({ zone_id: "zone-drc" });
  });

  it("treats a missing status as null", async () => {
    const get = vi.fn(async () => ({ enabled: false }));
    expect(await reader({ emailRouting: { get } }).getEmailRoutingSettings("z")).toEqual({ enabled: false, status: null });
  });

  it("gives the permission hint on 403", async () => {
    const get = vi.fn(async () => {
      throw new HttpError(403);
    });
    await expect(reader({ emailRouting: { get } }).getEmailRoutingSettings("z")).rejects.toThrow(/Email Routing Rules: Read/);
  });
});

describe("new reader failures are ProviderAccessError", () => {
  it("wraps a generic failure and redacts the token", async () => {
    const get = vi.fn(async () => {
      throw new Error(`boom ${TOKEN}`);
    });
    const err = await reader({ get })
      .listBuildVariableNames("a", "t")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderAccessError);
    expect((err as Error).message).not.toContain(TOKEN);
  });
});
