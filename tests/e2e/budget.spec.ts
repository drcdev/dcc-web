// Performance budget gate (successor of placeholder.budget.spec.ts). Each page
// template is measured on its own, with no averaging, on simulated mobile:
// Lighthouse's "slow 4G" network (150 ms RTT, 1.6 Mbps down, 750 kbps up) and
// 4x CPU slowdown at 390x844 (FR-027, SC-004; research R12).
//
// Carried forward from the placeholder: readable with JavaScript disabled, a
// noindex robots meta tag, and lang="en".
// Deliberately dropped (superseded by the spec's budget; listed for the PR
// description, T097): "zero <script> elements", "CLS exactly 0" and
// "total under 30 KB".
import { test, expect, type Browser } from "@playwright/test";
import { TEMPLATES } from "./templates.ts";

const BUDGET = {
  lcpMs: 2500,
  cls: 0.1,
  longTaskMs: 200,
  jsBytes: 10 * 1024,
  totalBytes: 100 * 1024,
};

interface Measurement {
  lcp: number | null;
  cls: number;
  longTaskMs: number;
  jsBytes: number;
  totalBytes: number;
}

async function measure(browser: Browser, path: string): Promise<Measurement> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    const w = window as unknown as { __budget: { lcp: number | null; cls: number; longTaskMs: number } };
    w.__budget = { lcp: null, cls: 0, longTaskMs: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.__budget.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) w.__budget.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      // Blocking time beyond 50 ms per long task, as Lighthouse's TBT counts it.
      for (const entry of list.getEntries()) w.__budget.longTaskMs += Math.max(0, entry.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  });

  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const types = new Map<string, string>();
  let jsBytes = 0;
  let totalBytes = 0;
  client.on("Network.responseReceived", (event) => {
    types.set(event.requestId, event.type);
  });
  client.on("Network.loadingFinished", (event) => {
    totalBytes += event.encodedDataLength;
    if (types.get(event.requestId) === "Script") jsBytes += event.encodedDataLength;
  });

  await page.goto(path, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  // LCP is finalised on the first input; a click on empty space ends LCP recording.
  await page.mouse.click(1, 1);
  await page.waitForTimeout(500);

  const vitals = await page.evaluate(
    () => (window as unknown as { __budget: { lcp: number | null; cls: number; longTaskMs: number } }).__budget,
  );
  await context.close();
  return { ...vitals, jsBytes, totalBytes };
}

// Page weight of a full listing (specs/008-blog T058; FR-041). The fixture site (port 4322) has 20
// posts (the real ones, dated 2025, fall on page 2), so `/writing/all/` shows 12 cards; the existing
// budget applies unchanged. `measure` takes an absolute address, so this case needs no project of its
// own.
test.describe("writing-all template with 12 cards on the fixture site — page budget", () => {
  test("meets LCP, CLS, long-task, JavaScript and total-transfer budgets on simulated mobile", async ({ browser }) => {
    const m = await measure(browser, "http://localhost:4322/writing/all/");
    test.info().annotations.push({ type: "budget", description: JSON.stringify(m) });
    expect(m.lcp, "LCP was recorded").not.toBeNull();
    expect(m.lcp!, "LCP (ms)").toBeLessThanOrEqual(BUDGET.lcpMs);
    expect(m.cls, "CLS").toBeLessThan(BUDGET.cls);
    expect(m.longTaskMs, "long-task time (ms)").toBeLessThanOrEqual(BUDGET.longTaskMs);
    expect(m.jsBytes, "JavaScript transferred (bytes)").toBeLessThanOrEqual(BUDGET.jsBytes);
    expect(m.totalBytes, "total transferred (bytes)").toBeLessThanOrEqual(BUDGET.totalBytes);
  });
});

for (const template of TEMPLATES) {
  test.describe(`${template.name} template — page budget`, () => {
    test("meets LCP, CLS, long-task, JavaScript and total-transfer budgets on simulated mobile", async ({
      browser,
    }) => {
      const m = await measure(browser, template.path);
      test.info().annotations.push({ type: "budget", description: JSON.stringify(m) });
      expect(m.lcp, "LCP was recorded").not.toBeNull();
      expect(m.lcp!, "LCP (ms)").toBeLessThanOrEqual(BUDGET.lcpMs);
      expect(m.cls, "CLS").toBeLessThan(BUDGET.cls);
      expect(m.longTaskMs, "long-task time (ms)").toBeLessThanOrEqual(BUDGET.longTaskMs);
      expect(m.jsBytes, "JavaScript transferred (bytes)").toBeLessThanOrEqual(BUDGET.jsBytes);
      expect(m.totalBytes, "total transferred (bytes)").toBeLessThanOrEqual(BUDGET.totalBytes);
    });

    test("is readable with JavaScript disabled", async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(template.path);
      expect((await page.locator("main").innerText()).trim().length).toBeGreaterThan(0);
      await context.close();
    });

    test("has a noindex robots meta tag", async ({ page }) => {
      await page.goto(template.path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });

    test('has lang="en" on <html>', async ({ page }) => {
      await page.goto(template.path);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });
  });
}
