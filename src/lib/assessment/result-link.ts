// The results link (specs/037-wayfinder-self-assessment/contracts/results-link.md). Pure, with no
// DOM and no Node APIs, so the browser module and the unit tests share it. The fragment holds the
// statement set version, the date and the five shift sums; it is never sent to a server.

export interface AssessmentResult {
  /** Eight lowercase hex digits (src/lib/assessment/version.ts). */
  version: string;
  /** `YYYY-MM-DD`, a real calendar date. */
  date: string;
  /** Five integers from 3 to 15, in the data file's shift order. */
  sums: number[];
}

export type DecodedResult = { kind: "none" } | { kind: "malformed" } | { kind: "result"; result: AssessmentResult };

const PREFIX = "result=";
const SHIFT_COUNT = 5;
const FRAGMENT = /^result=([0-9a-f]{8})\.(\d{8})\.(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})$/;

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const validSum = (text: string): boolean => /^(?:[3-9]|1[0-5])$/.test(text);

/** The fragment without `#`. Throws on a version, date or sums the grammar does not allow. */
export function encodeResult(result: AssessmentResult): string {
  const { version, date, sums } = result;
  if (!/^[0-9a-f]{8}$/.test(version)) throw new Error(`The results link version must be 8 lowercase hex digits, not "${version}".`);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!parts || !isRealDate(Number(parts[1]), Number(parts[2]), Number(parts[3]))) {
    throw new Error(`The results link date must be a real date written YYYY-MM-DD, not "${date}".`);
  }
  if (sums.length !== SHIFT_COUNT) throw new Error(`A result needs ${SHIFT_COUNT} sums, not ${sums.length}.`);
  for (const sum of sums) {
    if (!Number.isInteger(sum) || sum < 3 || sum > 15) throw new Error(`A sum must be a whole number from 3 to 15, not ${sum}.`);
  }
  return `${PREFIX}${version}.${parts[1]}${parts[2]}${parts[3]}.${sums.join("-")}`;
}

/** Reads `location.hash`, with or without the `#`. */
export function decodeResult(hash: string): DecodedResult {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!fragment.startsWith(PREFIX)) return { kind: "none" };
  const match = FRAGMENT.exec(fragment);
  if (!match) return { kind: "malformed" };
  const [, version, compact, ...sumTexts] = match as unknown as [string, string, string, ...string[]];
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  if (!isRealDate(year, month, day) || !sumTexts.every(validSum)) return { kind: "malformed" };
  return {
    kind: "result",
    result: {
      version,
      date: `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`,
      sums: sumTexts.map(Number),
    },
  };
}

/** `origin + pathname + "#" + fragment`; any query string is dropped. */
export function resultUrl(location: { origin: string; pathname: string; search?: string }, result: AssessmentResult): string {
  return `${location.origin}${location.pathname}#${encodeResult(result)}`;
}
