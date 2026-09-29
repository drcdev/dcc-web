// Read-only Cloudflare provider: the official `cloudflare` TypeScript SDK
// (Principle IV), used only through list/get/verify calls — this module never
// calls a create/update/delete/edit/patch/put SDK method. The token is
// read-only by the scope Don creates it with (research R14); the SDK itself
// cannot tell us that scope, so a 401/403 is reported as a missing-access
// `could-not-check`, never assumed to be a scope problem specifically.
import Cloudflare from "cloudflare";
import { ProviderAccessError, type CloudflareReader } from "../types.ts";
import { redact } from "../redact.ts";

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

    async listWorkerDomains(accountId: string, hostname?: string) {
      return guarded("Workers Scripts: Read", async () => {
        const domains: Array<{ hostname?: string; service?: string }> = [];
        for await (const domain of client.workers.domains.list({ account_id: accountId, hostname })) {
          domains.push(domain as never);
        }
        return domains.map((d) => ({ hostname: d.hostname ?? "", service: d.service ?? "" }));
      });
    },

    async listWebAnalyticsSites(accountId: string) {
      return guarded("Web Analytics Read", async () => {
        const sites: Array<{ site_tag?: string; host?: string; auto_install?: boolean }> = [];
        for await (const site of client.rum.siteInfo.list({ account_id: accountId })) {
          sites.push(site as never);
        }
        return sites.map((s) => ({ siteTag: s.site_tag ?? "", host: s.host ?? null, autoInstall: Boolean(s.auto_install) }));
      });
    },
  };
}
