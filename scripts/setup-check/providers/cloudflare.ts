// Read-only Cloudflare provider: the official `cloudflare` TypeScript SDK
// (Principle IV), used only through list/get/verify calls — this module never
// calls a create/update/delete/edit/patch/put SDK method. The token is
// read-only by the scope Don creates it with (research R14); the SDK itself
// cannot tell us that scope, so a 401/403 is reported as a missing-access
// `could-not-check`, never assumed to be a scope problem specifically.
import Cloudflare from "cloudflare";
import { ProviderAccessError, type CloudflareReader } from "../types.ts";
import { redact } from "../redact.ts";

/**
 * The only SQL this module ever sends. `listD1AppliedMigrations` has no parameter that can
 * carry SQL, so the D1 query endpoint is used strictly as a read of the migrations table.
 */
export const APPLIED_MIGRATIONS_SQL = "SELECT name FROM d1_migrations ORDER BY id";

function isNotFound(err: unknown): boolean {
  return (err as { status?: number } | undefined)?.status === 404;
}

/** Unwraps Cloudflare's `{ result }` envelope when the raw client returns it; otherwise the body itself. */
function unwrapResult(body: unknown): unknown {
  if (body && typeof body === "object" && !Array.isArray(body) && "result" in body) {
    return (body as { result: unknown }).result;
  }
  return body;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export interface CloudflareReaderOptions {
  token: string;
  /** Injectable for tests; defaults to a real `cloudflare` SDK client using `token`. */
  client?: Cloudflare;
}

function classifyCloudflareError(err: unknown, token: string, permissionHint: string): ProviderAccessError {
  const status = (err as { status?: number } | undefined)?.status;
  const rawMessage = err instanceof Error ? err.message : String(err);
  const message = redact(rawMessage, [token]);

  if (status === 401) {
    return new ProviderAccessError(
      `Cloudflare rejected the API token (401). Create or update it in .env (${message})`,
    );
  }
  if (status === 403) {
    return new ProviderAccessError(
      `Cloudflare token lacks ${permissionHint} read access (403): ${message}`,
    );
  }
  if (status === 429) {
    return new ProviderAccessError(`Cloudflare rate-limited the request (429): ${message}`);
  }
  if (typeof status === "number" && status >= 500) {
    return new ProviderAccessError(`Cloudflare had a server error (${status}): ${message}`);
  }
  return new ProviderAccessError(`Cloudflare request failed: ${message}`);
}

export function createCloudflareReader(options: CloudflareReaderOptions): CloudflareReader {
  const client = options.client ?? new Cloudflare({ apiToken: options.token });
  const token = options.token;

  async function guarded<T>(permissionHint: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      throw classifyCloudflareError(err, token, permissionHint);
    }
  }

  return {
    async verifyToken() {
      return guarded("token", async () => {
        const result = await client.user.tokens.verify();
        return { status: (result as { status?: string }).status ?? "unknown" };
      });
    },

    async getZone(zoneId: string) {
      return guarded("Zone: Read", async () => {
        const zone = await client.zones.get({ zone_id: zoneId });
        const z = zone as unknown as {
          id: string;
          name: string;
          status: string;
          name_servers?: string[];
          plan?: { name?: string };
        };
        return {
          id: z.id,
          name: z.name,
          status: z.status,
          plan: z.plan?.name,
          nameServers: z.name_servers ?? [],
        };
      });
    },

    async listZones(name: string) {
      return guarded("Zone: Read", async () => {
        const zones: Array<{ id: string; name: string; status: string; name_servers?: string[] }> = [];
        for await (const zone of client.zones.list({ name })) {
          zones.push(zone as never);
        }
        return zones.map((z) => ({ id: z.id, name: z.name, status: z.status, nameServers: z.name_servers ?? [] }));
      });
    },

    async listDnsRecords(zoneId: string) {
      return guarded("DNS: Read", async () => {
        const records: Array<{
          type?: string;
          name?: string;
          content?: string;
          priority?: number;
          ttl?: number;
          proxied?: boolean;
        }> = [];
        for await (const record of client.dns.records.list({ zone_id: zoneId })) {
          records.push(record as never);
        }
        return records.map((r) => ({
          type: r.type ?? "",
          name: r.name ?? "",
          content: r.content ?? "",
          priority: r.priority ?? null,
          ttl: r.ttl ?? 1,
          proxied: r.proxied ?? false,
        }));
      });
    },

    async getWorkerScript(accountId: string, scriptName: string) {
      return guarded("Workers Scripts: Read", async () => {
        try {
          await client.workers.scripts.get(scriptName, { account_id: accountId });
          return { id: scriptName };
        } catch (err) {
          if ((err as { status?: number } | undefined)?.status === 404) {
            return null;
          }
          throw err;
        }
      });
    },

    async getWorkersSubdomain(accountId: string) {
      return guarded("Workers Scripts: Read", async () => {
        const result = await client.workers.subdomains.get({ account_id: accountId });
        const r = result as unknown as { subdomain?: string | null; enabled?: boolean };
        return { subdomain: r.subdomain ?? null, enabled: r.enabled ?? Boolean(r.subdomain) };
      });
    },

    async listWebAnalyticsSites(accountId: string) {
      return guarded("Account Settings Read", async () => {
        const sites: Array<{
          site_tag?: string;
          host?: string;
          auto_install?: boolean;
          ruleset?: { zone_name?: string };
        }> = [];
        for await (const site of client.rum.siteInfo.list({ account_id: accountId })) {
          sites.push(site as never);
        }
        return sites.map((s) => ({
          siteTag: s.site_tag ?? "",
          host: s.host ?? null,
          autoInstall: Boolean(s.auto_install),
          zoneName: s.ruleset?.zone_name ?? null,
        }));
      });
    },

    async listD1Databases(accountId: string, name?: string) {
      return guarded("D1: Read", async () => {
        type Raw = { uuid?: string; name?: string; running_in_region?: string };
        const databases: Raw[] = [];
        for await (const database of client.d1.database.list({ account_id: accountId, ...(name ? { name } : {}) })) {
          databases.push(database as never);
        }
        const result = [];
        for (const d of databases) {
          const uuid = d.uuid ?? "";
          let region = d.running_in_region;
          if (region === undefined && uuid) {
            // The list response may omit the (undocumented) region; ask for the single database.
            const detail = (await client.d1.database.get(uuid, { account_id: accountId })) as unknown as Raw;
            region = detail?.running_in_region;
          }
          result.push({
            uuid,
            name: d.name ?? "",
            runningInRegion: typeof region === "string" ? region : undefined,
          });
        }
        return result;
      });
    },

    async listD1AppliedMigrations(accountId: string, databaseUuid: string) {
      return guarded("D1: Read", async () => {
        const names: string[] = [];
        try {
          for await (const page of client.d1.database.query(databaseUuid, {
            account_id: accountId,
            sql: APPLIED_MIGRATIONS_SQL,
          })) {
            for (const row of (page as unknown as { results?: Array<{ name?: unknown }> }).results ?? []) {
              if (typeof row.name === "string") names.push(row.name);
            }
          }
        } catch (err) {
          // A database nobody has migrated yet has no d1_migrations table: nothing applied.
          if (/no such table/i.test(err instanceof Error ? err.message : String(err))) return [];
          throw err;
        }
        return names;
      });
    },

    async listWorkerSecretNames(accountId: string, scriptName: string) {
      return guarded("Workers Scripts: Read", async () => {
        const names: string[] = [];
        try {
          for await (const secret of client.workers.scripts.secrets.list(scriptName, { account_id: accountId })) {
            const name = (secret as { name?: unknown }).name;
            if (typeof name === "string") names.push(name);
          }
        } catch (err) {
          if (isNotFound(err)) return [];
          throw err;
        }
        return names;
      });
    },

    async listWorkerCrons(accountId: string, scriptName: string) {
      return guarded("Workers Scripts: Read", async () => {
        try {
          const result = await client.workers.scripts.schedules.get(scriptName, { account_id: accountId });
          return ((result as { schedules?: Array<{ cron?: unknown }> }).schedules ?? [])
            .map((s) => s.cron)
            .filter((c): c is string => typeof c === "string");
        } catch (err) {
          if (isNotFound(err)) return [];
          throw err;
        }
      });
    },

    async listBuildTriggers(accountId: string, scriptName: string) {
      return guarded("Workers Builds Configuration: Read", async () => {
        let tag: string | undefined;
        for await (const script of client.workers.scripts.list({ account_id: accountId })) {
          const s = script as { id?: string; tag?: string };
          if (s.id === scriptName) {
            tag = s.tag;
            break;
          }
        }
        if (!tag) return [];
        const body = await client.get<unknown>(`/accounts/${accountId}/builds/workers/${tag}/triggers`);
        const triggers = unwrapResult(body);
        if (!Array.isArray(triggers)) return [];
        return triggers.map((t: Record<string, unknown>) => ({
          uuid: typeof t.trigger_uuid === "string" ? t.trigger_uuid : "",
          name: typeof t.trigger_name === "string" ? t.trigger_name : "",
          branchIncludes: stringList(t.branch_includes),
          branchExcludes: stringList(t.branch_excludes),
          buildCommand: stringOrNull(t.build_command),
          deployCommand: stringOrNull(t.deploy_command),
        }));
      });
    },

    async listBuildVariableNames(accountId: string, triggerUuid: string) {
      return guarded("Workers Builds Configuration: Read", async () => {
        const body = await client.get<unknown>(
          `/accounts/${accountId}/builds/triggers/${triggerUuid}/environment_variables`,
        );
        const variables = unwrapResult(body);
        // Keys only: the value of a variable is never read out of the response.
        if (Array.isArray(variables)) {
          return variables
            .map((v: Record<string, unknown>) => v.key ?? v.name)
            .filter((k): k is string => typeof k === "string");
        }
        if (variables && typeof variables === "object") return Object.keys(variables);
        return [];
      });
    },

    async listTurnstileWidgets(accountId: string) {
      return guarded("Turnstile Sites: Read", async () => {
        const widgets: Array<{ name?: string; domains?: unknown; mode?: string }> = [];
        for await (const widget of client.turnstile.widgets.list({ account_id: accountId })) {
          widgets.push(widget as never);
        }
        // Only name, domains and mode: `sitekey` and `secret` are dropped here.
        return widgets.map((w) => ({
          name: w.name ?? "",
          domains: stringList(w.domains),
          mode: w.mode ?? "",
        }));
      });
    },

    async listEmailRoutingAddresses(accountId: string) {
      return guarded("Email Routing Addresses: Read", async () => {
        const addresses: Array<{ email?: string; verified?: unknown }> = [];
        for await (const address of client.emailRouting.addresses.list({ account_id: accountId })) {
          addresses.push(address as never);
        }
        // Only the address and whether it is verified: the tag and id are dropped.
        return addresses.map((a) => ({ email: a.email ?? "", verified: stringOrNull(a.verified) }));
      });
    },

    async getEmailRoutingSettings(zoneId: string) {
      return guarded("Email Routing Rules: Read", async () => {
        const settings = (await client.emailRouting.get({ zone_id: zoneId })) as { enabled?: unknown; status?: unknown };
        // Only whether routing is on and its status: the tag, id and dates are dropped.
        return { enabled: settings.enabled === true, status: stringOrNull(settings.status) };
      });
    },
  };
}
