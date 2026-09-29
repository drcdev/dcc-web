// Read-only public DNS provider: node:dns/promises' Resolver pinned to public
// resolvers (1.1.1.1, 8.8.8.8) so answers reflect the internet's view, not a
// local or ISP resolver's cache (research). No write capability exists in
// node:dns, so this module is read-only by construction.
import { Resolver } from "node:dns/promises";
import { ProviderAccessError, type DnsAnswer, type DnsReader, type DnsRecordType } from "../types.ts";

const PUBLIC_RESOLVERS = ["1.1.1.1", "8.8.8.8"];
const RESOLVE_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ProviderAccessError(`DNS lookup for ${label} timed out after ${ms / 1000} seconds`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function isNoDataError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  return code === "ENODATA" || code === "ENOTFOUND" || code === "NXDOMAIN" || code === "ESERVFAIL";
}

async function resolveOne(resolver: Resolver, name: string, type: DnsRecordType): Promise<DnsAnswer[]> {
  try {
    switch (type) {
      case "A": {
        const addrs = await resolver.resolve4(name);
        return addrs.map((value) => ({ type, name, value }));
      }
      case "AAAA": {
        const addrs = await resolver.resolve6(name);
        return addrs.map((value) => ({ type, name, value }));
      }
      case "CNAME": {
        const targets = await resolver.resolveCname(name);
        return targets.map((value) => ({ type, name, value }));
      }
      case "MX": {
        const records = await resolver.resolveMx(name);
        return records.map((r) => ({ type, name, value: r.exchange, priority: r.priority }));
      }
      case "TXT": {
        const records = await resolver.resolveTxt(name);
        return records.map((parts) => ({ type, name, value: parts.join("") }));
      }
      case "NS": {
        const servers = await resolver.resolveNs(name);
        return servers.map((value) => ({ type, name, value }));
      }
      case "CAA": {
        const records = await resolver.resolveCaa(name);
        return records.map((r) => ({ type, name, value: `${r.critical} ${r.issue ?? r.issuewild ?? r.iodef ?? ""}`.trim() }));
      }
      case "SRV": {
        const records = await resolver.resolveSrv(name);
        return records.map((r) => ({ type, name, value: `${r.weight} ${r.port} ${r.name}`, priority: r.priority }));
      }
      default:
        return [];
    }
  } catch (err) {
    if (isNoDataError(err)) {
      return [];
    }
    throw new ProviderAccessError(
      `public DNS lookup for ${type} ${name} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function createDnsReader(servers: string[] = PUBLIC_RESOLVERS): DnsReader {
  const resolver = new Resolver();
  resolver.setServers(servers);

  return {
    async resolve(name: string, type: DnsRecordType): Promise<DnsAnswer[]> {
      return withTimeout(resolveOne(resolver, name, type), RESOLVE_TIMEOUT_MS, `${type} ${name}`);
    },
    async resolveNameservers(name: string): Promise<string[]> {
      const answers = await withTimeout(resolveOne(resolver, name, "NS"), RESOLVE_TIMEOUT_MS, `NS ${name}`);
      return answers.map((a) => a.value);
    },
  };
}
