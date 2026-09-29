// Records every Content Security Policy violation a page reports, from before
// any page script runs, so a spec can assert that nothing was refused
// (FR-024a, FR-024b).
import type { BrowserContext, Page } from "@playwright/test";

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

export async function recordCspViolations(target: Page | BrowserContext) {
  await target.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations!.push(`${event.effectiveDirective} blocked ${event.blockedURI || "inline"}`);
    });
  });
}

export const cspViolations = (page: Page) => page.evaluate(() => window.__cspViolations ?? []);
