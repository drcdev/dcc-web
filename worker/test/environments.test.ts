// SC-006, FR-017, FR-024: production and preview hold separate data and separate read tokens.
// This file runs in both Vitest projects of worker/vitest.config.ts. The `production` project
// loads wrangler.jsonc as-is; the `preview` project loads it with `environment: "preview"`.
// Each project injects EXPECTED_ENVIRONMENT, EXPECTED_DATABASE_NAME (read from the resolved
// wrangler config, not typed here) and the other environment's read token, so the same
// assertions prove each side against the other.
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { api, clearRows, mockSiteverify, ORIGIN, post, rows, run, validBody } from "./helpers";

beforeEach(async () => {
  await clearRows();
});

const expected = env.EXPECTED_ENVIRONMENT;
const other = expected === "preview" ? "production" : "preview";

describe(`the ${expected} environment`, () => {
  it("binds DB to its own D1 database and never the other's", () => {
    // Shape, not live names, so the test holds before and after the database swap commit.
    const production = expected === "preview" ? env.OTHER_DATABASE_NAME : env.EXPECTED_DATABASE_NAME;
    const preview = expected === "preview" ? env.EXPECTED_DATABASE_NAME : env.OTHER_DATABASE_NAME;
    expect(preview).toBe(`${production}-preview`);
    expect(env.EXPECTED_DATABASE_NAME).not.toBe(env.OTHER_DATABASE_NAME);
  });

  it("uses its own read token and refuses the other environment's with the identical 401", async () => {
    const own = await run(api("/api/messages/new", { token: env.CONTACT_READ_TOKEN }));
    expect(own.status).toBe(200);

    const refused = await run(api("/api/messages/new", { token: env.OTHER_READ_TOKEN }));
    const missing = await run(api("/api/messages/new", { token: null }));
    expect(refused.status).toBe(401);
    expect(await refused.text()).toBe(await missing.text());
    expect([...refused.headers].sort()).toEqual([...missing.headers].sort());
  });

  it("stores a submitted message only in its own database, visible only with its own token", async () => {
    mockSiteverify({ success: true, action: "contact", hostname: new URL(ORIGIN).hostname });
    const response = await run(post(validBody({ name: `Sender ${expected}` })));
    expect(response.status).toBe(200);
    expect(await rows()).toHaveLength(1);

    const listed = (await (await run(api("/api/messages/new", { token: env.CONTACT_READ_TOKEN }))).json()) as {
      messages: { name: string }[];
    };
    expect(listed.messages.map((m) => m.name)).toEqual([`Sender ${expected}`]);
    expect(JSON.stringify(listed)).not.toContain(`Sender ${other}`);

    const crossed = await run(api("/api/messages/new", { token: env.OTHER_READ_TOKEN }));
    expect(crossed.status).toBe(401);
    expect(await crossed.text()).not.toContain(`Sender ${expected}`);
  });
});
