// The secret/variable manifest (data-model.md "SecretRef"). Names only — no
// value is ever part of this model. Every SetupItem.secrets entry and every
// secret name referenced by a workflow, wrangler.jsonc or .env.example must
// exist here (enforced by tests/unit/setup/drift.test.ts).
import type { SecretRef } from "./types.ts";

export const secretManifest: SecretRef[] = [
  {
    name: "CLOUDFLARE_API_TOKEN",
    kind: "secret",
    store: "local-env",
    purpose: "Read-only token the setup check uses for Cloudflare reads",
    permissions: "Cloudflare: Zone Read, DNS Read, Workers Scripts Read, Account Settings Read",
    usedBy: ["local-credentials", "cloudflare-zone", "dns-records-parity", "dns-nameservers", "cloudflare-worker", "review-address", "web-analytics"],
  },
  {
    name: "CLOUDFLARE_ACCOUNT_ID",
    kind: "variable",
    store: "local-env",
    purpose: "Account the check reads",
    permissions: null,
    usedBy: ["local-credentials", "cloudflare-worker", "review-address", "web-analytics"],
  },
  {
    name: "CLOUDFLARE_ZONE_ID",
    kind: "variable",
    store: "local-env",
    purpose: "Zone the check reads",
    permissions: null,
    usedBy: ["local-credentials", "cloudflare-zone", "dns-records-parity", "dns-nameservers"],
  },
  {
    name: "DCC_BOT_GITHUB_CREDENTIAL",
    kind: "secret",
    store: "gh-keyring",
    purpose: "Machine account credential used by agents to open pull requests (named, never stored in the repo)",
    permissions: "GitHub: repository write or maintain, never admin",
    usedBy: ["github-machine-account"],
  },
];

export function findSecret(name: string): SecretRef | undefined {
  return secretManifest.find((s) => s.name === name);
}
