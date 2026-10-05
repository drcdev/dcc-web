// The projects index shows its theme filter only when it lists more than this many projects.
// The fixture-site build (scripts/build-fixture-site.ts) lowers this value in its own copy of
// the source, so the browser tests still reach the filter; this file is never changed by it.
export const PROJECT_FILTER_THRESHOLD = 10;
