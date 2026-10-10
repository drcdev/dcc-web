// SC-006, FR-024: production and preview hold separate data.
// This file runs in both Vitest projects of worker/vitest.config.ts. The `production` project
// loads wrangler.jsonc as-is; the `preview` project loads it with `environment: "preview"`.
// Each project injects EXPECTED_ENVIRONMENT, EXPECTED_DATABASE_NAME and OTHER_DATABASE_NAME (read from
// the resolved wrangler configs, not typed here), so the same assertions prove each side against the other.
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { fakeEmail, mockSiteverify, post, run } from "./helpers";

const expected = env.EXPECTED_ENVIRONMENT;

describe(`the ${expected} environment`, () => {
  it("binds DB to its own D1 database and never the other's", () => {
    // Shape, not live names, so the test holds before and after the database swap commit.
    const production = expected === "preview" ? env.OTHER_DATABASE_NAME : env.EXPECTED_DATABASE_NAME;
    const preview = expected === "preview" ? env.EXPECTED_DATABASE_NAME : env.OTHER_DATABASE_NAME;
    expect(preview).toBe(`${production}-preview`);
    expect(env.EXPECTED_DATABASE_NAME).not.toBe(env.OTHER_DATABASE_NAME);
  });

  it("keeps its own usage bucket row: draining it leaves no trace in the other environment's data (Q26)", async () => {
    // Each Vitest project has its own local D1, so a drained bucket here is visible only here.
    await env.DB.prepare("UPDATE usage_bucket SET tokens = 0, updated_at = 1 WHERE id = 1").run();
    const row = await env.DB.prepare("SELECT tokens FROM usage_bucket WHERE id = 1").first<{ tokens: number }>();
    expect(row?.tokens).toBe(0);
    expect(env.EXPECTED_DATABASE_NAME).not.toBe(env.OTHER_DATABASE_NAME);
  });

  it("marks the contact email as preview only when SITE_ENVIRONMENT is preview (FR-016)", async () => {
    mockSiteverify();
    const email = fakeEmail();
    const response = await run(post(), { CONTACT_EMAIL: email });
    expect(response.status).toBe(200);
    const sent = email.sent[0] as { subject: string; text: string };
    if (expected === "preview") {
      expect(env.SITE_ENVIRONMENT).toBe("preview");
      expect(sent.subject.startsWith("[Preview] ")).toBe(true);
      expect(sent.text).toContain("preview deployment");
    } else {
      expect(env.SITE_ENVIRONMENT).toBeUndefined();
      expect(sent.subject.startsWith("[Preview] ")).toBe(false);
      expect(sent.text).not.toContain("preview deployment");
    }
  });
});
