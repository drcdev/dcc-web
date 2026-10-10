// Non-main branches are served by the preview Worker (007-contact-form contracts/worker-config.md).
// Pure resolver for the address a build is served from (contracts/site-origin.md,
// specs/002-site-foundation/research.md R2). Called from astro.config.mjs (which
// reads process.env, not import.meta.env — Astro's config file runs before
// .env files are loaded) and from scripts/deploy/preview.ts, so the site's
// `site` value and the preview upload's alias always agree.

import type { BuildEnv } from "./build-mode.ts";

/** Used whenever the served address cannot be determined (spec Assumptions). */
export const FALLBACK_ORIGIN = "https://doncoleman.ca";

export type SiteOriginEnv = BuildEnv;

export interface SiteOriginConfig {
  workerName: string;
  /** The preview Worker (`dcc-web-preview`); non-main branch builds are served from it. */
  previewWorkerName?: string;
  workersSubdomain?: string;
}

const DNS_LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
/** Preview Worker whose name bounds the alias when the caller gives none. */
export const PREVIEW_WORKER_NAME = "dcc-web-preview";
/** Cloudflare alias rule: alias + "-" + worker name must be <= 63 characters. */
const MAX_ALIAS_LENGTH = 63 - `-${PREVIEW_WORKER_NAME}`.length;

/**
 * Derives a Cloudflare Workers preview alias from a branch name: lowercase,
 * collapse every run of non-alphanumeric characters to one dash, trim leading
 * and trailing dashes, prefix `br-` when the result would not start with a
 * letter, and truncate to the length Cloudflare allows. Returns `null` when no
 * alias can be produced (contracts/site-origin.md).
 */
export function previewAlias(branch: string): string | null {
  let slug = branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length === 0) return null;

  if (!/^[a-z]/.test(slug)) {
    slug = `br-${slug}`;
  }

  if (slug.length > MAX_ALIAS_LENGTH) {
    slug = slug.slice(0, MAX_ALIAS_LENGTH).replace(/-+$/, "");
  }

  return slug.length === 0 ? null : slug;
}

function isValidHost(host: unknown): host is string {
  return typeof host === "string" && host.length > 0;
}

/**
 * Resolves the origin a build should treat as its own served address, per the
 * resolution table in contracts/site-origin.md. Always falls back to
 * `FALLBACK_ORIGIN` rather than guessing.
 */
export function resolveSiteOrigin(env: SiteOriginEnv, config: SiteOriginConfig): string {
  if (env.WORKERS_CI !== "1") return FALLBACK_ORIGIN;
  if (!isValidHost(config.workerName)) return FALLBACK_ORIGIN;

  const branch = env.WORKERS_CI_BRANCH;
  if (!branch) return FALLBACK_ORIGIN;

  if (branch === "main") return FALLBACK_ORIGIN;

  if (!isValidHost(config.previewWorkerName)) return FALLBACK_ORIGIN;

  if (!isValidHost(config.workersSubdomain) || !DNS_LABEL_PATTERN.test(config.workersSubdomain)) {
    return FALLBACK_ORIGIN;
  }

  const alias = previewAlias(branch);
  if (!alias) return FALLBACK_ORIGIN;

  return `https://${alias}-${config.previewWorkerName}.${config.workersSubdomain}.workers.dev`;
}
