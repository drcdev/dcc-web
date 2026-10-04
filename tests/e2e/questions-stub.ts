// Stubs POST /api/questions for the panel journeys. The fixture site on port 4322 is served by
// `astro preview` with no Worker, so no real model is ever called (specs/022 research R12).
import type { Page } from "@playwright/test";

export interface StubResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
  /** Hold this response until `release()` is called (for the loading state). */
  hold?: boolean;
}

export interface QuestionsStub {
  /** Parsed JSON body of each request, in order. */
  requests: unknown[];
  /** Lets the oldest held response go. */
  release: () => void;
}

/** Answers each request to `**\/api/questions` with the next queued response (the last one repeats). */
export async function stubQuestionsApi(page: Page, responses: StubResponse[]): Promise<QuestionsStub> {
  const requests: unknown[] = [];
  const gates: (() => void)[] = [];
  let next = 0;

  await page.route("**/api/questions", async (route) => {
    const request = route.request();
    try {
      requests.push(request.postDataJSON());
    } catch {
      requests.push(request.postData());
    }
    const response = responses[Math.min(next, responses.length - 1)] ?? {};
    next += 1;
    if (response.hold) await new Promise<void>((resolve) => gates.push(resolve));
    await route.fulfill({
      status: response.status ?? 200,
      headers: { "content-type": "application/json", ...response.headers },
      body: JSON.stringify(response.body ?? {}),
    });
  });

  return { requests, release: () => gates.shift()?.() };
}
