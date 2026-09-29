import { test, expect } from "@playwright/test";

test.describe("placeholder page — page budget", () => {
  test("ships zero <script> elements and makes zero JS requests", async ({ page }) => {
    const jsRequests: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") {
        jsRequests.push(request.url());
      }
    });

    await page.goto("/");
    await expect(page.locator("script")).toHaveCount(0);
    expect(jsRequests).toEqual([]);
  });

  test("has zero layout shift (CLS 0)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let clsValue = 0;
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as (PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
              })[]) {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                }
              }
            });
            observer.observe({ type: "layout-shift", buffered: true });
            setTimeout(() => {
              observer.disconnect();
              resolve(clsValue);
            }, 200);
          } catch {
            resolve(0);
          }
        }),
    );
    expect(cls).toBe(0);
  });

  test("total transfer is under 30 KB", async ({ page }) => {
    let totalBytes = 0;
    page.on("response", async (response) => {
      try {
        const body = await response.body();
        totalBytes += body.length;
      } catch {
        // Response body not available (e.g. redirects); ignore.
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    expect(totalBytes).toBeLessThan(30 * 1024);
  });

  test("is readable with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const text = await page.locator("main").innerText();
    expect(text.trim().length).toBeGreaterThan(0);
    await context.close();
  });

  test("has a noindex robots meta tag", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator('meta[name="robots"]');
    await expect(meta).toHaveAttribute("content", /noindex/);
  });

  test("has lang=\"en\" on <html>", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
