// Addresses and slugs from file paths for pages, posts and projects, and the checks that no two
// files or routes claim one (contracts/build-errors.md page rows 13, 14, 17, post rows P13 to P17,
// project rows 26 and 27; FR-003, FR-008). One table holds what differs per collection. The
// per-collection entry points keep the names their callers use.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { seriesIds } from "../../config/topics.ts";
import { contentError, type ContentKind } from "./errors.ts";

const DIRS: Record<ContentKind, string> = {
  page: "src/content/pages",
  post: "src/content/posts",
  project: "src/content/projects",
};
const ROUTES_DIR = "src/pages";
const NAME = /^[a-z0-9-]+$/;
const NAME_RULE = "lower-case letters, digits and hyphens";
/** Addresses under /writing/ that belong to listing pages, so no post may use them. */
const RESERVED_POSTS = new Set<string>(["all", "topics", ...seriesIds]);

/** The address of a page file, given its path below src/content/pages/ (for example `legal/index.mdx`). */
export function addressFromPath(path: string): string {
  const segments = path.replace(/\.mdx?$/, "").split("/");
  if (segments.at(-1) === "index") segments.pop();
  if (!segments.every((segment) => NAME.test(segment))) {
    throw contentError("page", `${DIRS.page}/${path}`, `file and folder names may use only ${NAME_RULE}. Rename the file.`);
  }
  return segments.length === 0 ? "/" : `/${segments.join("/")}/`;
}

/** The collection entry id for a page file: `index` for the home page, else the address without its slashes. */
export function idFromPath(path: string): string {
  const address = addressFromPath(path);
  return address === "/" ? "index" : address.slice(1, -1);
}

/** The slug of a post file, given its path below src/content/posts/: the file name without `.mdx`. */
export function slugFromPostPath(path: string): string {
  return (path.split("/").at(-1) ?? path).replace(/\.mdx?$/, "");
}

/** The address of a post: `/writing/{slug}/`. */
export function postHref(slug: string): string {
  return `/writing/${slug}/`;
}

/** The slug of a project file, given its path below src/content/projects/. */
export function slugFromPath(path: string): string {
  const file = `${DIRS.project}/${path}`;
  if (path.includes("/")) {
    throw contentError("project", file, "project files must sit directly in the projects folder, not in a subfolder. Move the file.");
  }
  const slug = path.replace(/\.mdx?$/, "");
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
    throw contentError("project", file, `file names may use only ${NAME_RULE} (up to 64 characters). Rename the file.`);
  }
  return slug;
}

/**
 * Throws when another file in the collection folder would make the same id as `entry` (for
 * example `x.md` and `x.mdx`, or for pages `x.mdx` and `x/index.mdx`). The files are named in
 * sorted order, so the message is the same whichever one is loaded first. Run from `generateId`,
 * which sees every file before Astro's own duplicate check does.
 * @param base absolute path of the collection folder
 * @param entry path of the file below it
 */
export function assertNoTwin(kind: ContentKind, base: string, entry: string): void {
  const id = kind === "page" ? idFromPath(entry) : kind === "post" ? slugFromPostPath(entry) : slugFromPath(entry);
  const names = [`${id}.md`, `${id}.mdx`];
  if (kind === "page") names.push(`${id}/index.md`, `${id}/index.mdx`);
  const twin = names.find((name) => name !== entry && existsSync(resolve(base, name)));
  if (!twin) return;
  const what = kind === "page" ? `address ${addressFromPath(entry)}` : kind === "post" ? `address ${postHref(id)}` : `slug ${id}`;
  const [a, b] = [entry, twin].sort();
  throw contentError(kind, [`${DIRS[kind]}/${a}`, `${DIRS[kind]}/${b}`], `both make the ${what}. Keep one of them.`);
}

interface RouteClaim {
  file: string;
  /** Addresses this route file produces. */
  addresses: string[];
  /** For a route with a variable part: the address segments before it. Pages under this prefix are claimed. */
  prefix: string[];
}

function claimFromRouteFile(path: string): RouteClaim {
  const segments = path.replace(/\.(astro|md|mdx|ts|js)$/, "").split("/");
  const file = `${ROUTES_DIR}/${path}`;
  const variable = segments.findIndex((segment) => segment.startsWith("["));
  if (variable !== -1) return { file, addresses: [], prefix: segments.slice(0, variable) };
  if (segments.at(-1) === "index") segments.pop();
  const addresses = new Set<string>([segments.length === 0 ? "/" : `/${segments.join("/")}/`]);
  // A generated file such as robots.txt.ts also reserves the address of its stem.
  const last = segments.at(-1) ?? "";
  if (last.includes(".")) addresses.add(`/${[...segments.slice(0, -1), last.split(".")[0]].join("/")}/`);
  return { file, addresses: [...addresses], prefix: [] };
}

export interface AddressInputs {
  /** Page file paths below src/content/pages/. */
  pageFiles: readonly string[];
  /** Route file paths below src/pages/, without the pages route `[...slug].astro`. */
  routeFiles: readonly string[];
  /** Addresses reserved for later features (`futureDestinations`). */
  reserved: readonly string[];
}

/** Throws when a page address is claimed by a route in src/pages/ or reserved for a later feature. */
export function assertPageAddressesFree({ pageFiles, routeFiles, reserved }: AddressInputs): void {
  const claims = [...routeFiles].sort().map(claimFromRouteFile);
  for (const path of [...pageFiles].sort()) {
    const file = `${DIRS.page}/${path}`;
    const address = addressFromPath(path);
    const segments = address.split("/").filter(Boolean);
    for (const claim of claims) {
      const underPrefix = claim.prefix.length > 0 && claim.prefix.every((segment, index) => segments[index] === segment);
      if (claim.addresses.includes(address) || underPrefix) {
        throw contentError("page", [file, claim.file], `the address ${address} is already used by ${claim.file}. Rename the page file.`);
      }
    }
    if (reserved.includes(address)) {
      throw contentError("page", file, `the address ${address} is reserved for a later feature. Rename the page file.`);
    }
  }
}

/**
 * Throws when a post file breaks a path rule. `files` are paths below src/content/posts/; anything
 * under `images/` is a picture folder and is ignored, as are files that are not Markdown or MDX.
 */
export function assertPostFiles(files: readonly string[]): void {
  for (const path of [...files].sort()) {
    if (path.startsWith("images/") || !/\.mdx?$/.test(path)) continue;
    const file = `${DIRS.post}/${path}`;
    const slug = slugFromPostPath(path);
    if (path.includes("/")) throw contentError("post", file, "posts cannot be in a sub-folder. Move the file to src/content/posts/.");
    if (!path.endsWith(".mdx")) throw contentError("post", file, "a post must be an .mdx file, so rename it to .mdx.");
    if (!NAME.test(slug)) throw contentError("post", file, `the file name may use only ${NAME_RULE}. Rename the file.`);
    if (RESERVED_POSTS.has(slug)) {
      const page = (seriesIds as readonly string[]).includes(slug) ? "the series page" : "a listing page";
      throw contentError("post", file, `the address ${postHref(slug)} is reserved for ${page}. Rename the file.`);
    }
  }
}
