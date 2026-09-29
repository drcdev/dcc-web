// Page addresses from file paths, and the checks that no two things claim the
// same address (data-model.md "derived values" and invariants 3 and 9;
// contracts/build-errors.md rows 13, 14, 17; FR-003, FR-008). Pure functions:
// the route passes in file lists from import.meta.glob.
import { pageFileError, pageFilesError } from "./errors.ts";

const PAGES_DIR = "src/content/pages";
const ROUTES_DIR = "src/pages";
const SEGMENT = /^[a-z0-9-]+$/;

/** The address of a page file, given its path below src/content/pages/ (for example `legal/index.mdx`). */
export function addressFromPath(path: string): string {
  const segments = path.replace(/\.mdx?$/, "").split("/");
  if (segments.at(-1) === "index") segments.pop();
  if (!segments.every((segment) => SEGMENT.test(segment))) {
    throw pageFileError(
      `${PAGES_DIR}/${path}`,
      "file and folder names may use only lower-case letters, digits and hyphens. Rename the file.",
    );
  }
  return segments.length === 0 ? "/" : `/${segments.join("/")}/`;
}

/** The collection entry id for a page file: `index` for the home page, else the address without its slashes. */
export function idFromPath(path: string): string {
  const address = addressFromPath(path);
  return address === "/" ? "index" : address.slice(1, -1);
}

interface RouteClaim {
  file: string;
  /** Addresses this route file produces. */
  addresses: string[];
  /** For a route with a variable part: the address segments before it. Pages under this prefix are claimed. */
  prefix: string[];
}

function claimFromRouteFile(path: string): RouteClaim | undefined {
  const segments = path.replace(/\.(astro|md|mdx|ts|js)$/, "").split("/");
  const file = `${ROUTES_DIR}/${path}`;
  const variable = segments.findIndex((segment) => segment.startsWith("["));
  if (variable !== -1) {
    // The pages route itself is the one route allowed to be variable at the root.
    return { file, addresses: [], prefix: segments.slice(0, variable) };
  }
  if (segments.at(-1) === "index") segments.pop();
  const addresses = new Set<string>();
  const stem = segments.join("/");
  addresses.add(segments.length === 0 ? "/" : `/${stem}/`);
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

/** Throws a PageContentError when two page files, a page and a route, or a page and a reserved address collide. */
export function assertUniqueAddresses({ pageFiles, routeFiles, reserved }: AddressInputs): void {
  const pages = [...pageFiles].sort().map((path) => ({
    file: `${PAGES_DIR}/${path}`,
    address: addressFromPath(path),
  }));

  const seen = new Map<string, string>();
  for (const { file, address } of pages) {
    const first = seen.get(address);
    if (first) throw pageFilesError(first, file, `both make the address ${address}. Keep one of them.`);
    seen.set(address, file);
  }

  const claims = [...routeFiles].sort().flatMap((path) => claimFromRouteFile(path) ?? []);
  for (const { file, address } of pages) {
    const segments = address.split("/").filter(Boolean);
    for (const claim of claims) {
      const underPrefix =
        claim.prefix.length > 0 && claim.prefix.every((segment, index) => segments[index] === segment);
      if (claim.addresses.includes(address) || underPrefix) {
        throw pageFilesError(
          file,
          claim.file,
          `the address ${address} is already used by ${claim.file}. Rename the page file.`,
        );
      }
    }
    if (reserved.includes(address)) {
      throw pageFileError(file, `the address ${address} is reserved for a later feature. Rename the page file.`);
    }
  }
}
