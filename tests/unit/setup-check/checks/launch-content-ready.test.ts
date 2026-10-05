import { describe, expect, it } from "vitest";
import { check } from "../../../../scripts/setup-check/checks/launch-content-ready.ts";
import { setupItems } from "../../../../scripts/setup-check/items.ts";
import { fakeProviderContext } from "./test-helpers.ts";

const NEXT = "Replace the placeholder copy and publish the page (draft: false), then run this check again.";
const GOOD_PRIVACY = "---\ntitle: Privacy\ndraft: false\n---\nMessages are stored in a Cloudflare D1 database.\n";

interface Files {
  pages?: Record<string, string>;
  projects?: Record<string, string>;
}

function ctxFor(
  files: Files,
  config: unknown = { launch: { expectedPages: ["about", "privacy-policy"], expectedPaths: [] } },
) {
  const pages: Record<string, string> = {
    about: "---\ntitle: About\ndraft: false\n---\nHello.\n",
    "privacy-policy": GOOD_PRIVACY,
    ...files.pages,
  };
  const projects = files.projects ?? { "focus-pocus": "---\ntitle: FP\nvisual:\n  kind: image\n---\nBody\n" };
  const text: Record<string, string> = {};
  for (const [id, body] of Object.entries(pages)) text[`src/content/pages/${id}.mdx`] = body;
  for (const [id, body] of Object.entries(projects)) text[`src/content/projects/${id}.mdx`] = body;
  return fakeProviderContext({
    fs: {
      readJson: (() => config) as never,
      readText: (p: string) => text[p] ?? null,
      exists: (p: string) => p in text,
      listFiles: (dir: string) => {
        const prefix = `${dir.replace(/\/$/, "")}/`;
        return Object.keys(text)
          .filter((p) => p.startsWith(prefix))
          .map((p) => p.slice(prefix.length));
      },
    },
  });
}

describe("checks/launch-content-ready", () => {
  it("is complete when every rule passes", async () => {
    const result = await check(ctxFor({}));
    expect(result.status).toBe("complete");
    expect(result.id).toBe("launch-content-ready");
    expect(result.step).toBe(`Step 25 of ${setupItems.length}`);
    expect(result.docs).toBe("docs/setup.md#launch-content-ready");
  });

  it("is missing for a draft expected page", async () => {
    const result = await check(ctxFor({ pages: { about: "---\ntitle: About\ndraft: true\n---\nHi\n" } }));
    expect(result.status).toBe("missing");
    expect(result.summary).toBe("1 launch content problem(s).");
    expect(result.details).toEqual(["about: page is still a draft"]);
    expect(result.nextAction).toBe(NEXT);
  });

  it("is missing for an expected page whose file is absent", async () => {
    const result = await check(
      ctxFor({}, { launch: { expectedPages: ["about", "privacy-policy", "services"], expectedPaths: [] } }),
    );
    expect(result.status).toBe("missing");
    expect(result.details).toContain("services: page file src/content/pages/services.mdx is missing");
  });

  it("is missing for 'placeholder copy' in any letter case in a non-draft page", async () => {
    const result = await check(
      ctxFor({ pages: { about: "---\ntitle: About\ndraft: false\n---\nThis is Placeholder COPY.\n" } }),
    );
    expect(result.status).toBe("missing");
    expect(result.details).toEqual(['about: still says "placeholder copy"']);
  });

  it("ignores placeholder copy in a draft page", async () => {
    const result = await check(ctxFor({ pages: { extra: "---\ntitle: X\ndraft: true\n---\nplaceholder copy\n" } }));
    expect(result.status).toBe("complete");
  });

  it("is missing for a project with placeholder: true", async () => {
    const result = await check(
      ctxFor({
        projects: { "focus-pocus": "---\ntitle: FP\nvisual:\n  kind: image\n  placeholder: true\n---\nBody\n" },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.details).toEqual(["focus-pocus: project visual marked placeholder"]);
  });

  it("is missing when the privacy policy does not state Cloudflare D1 storage", async () => {
    const result = await check(
      ctxFor({ pages: { "privacy-policy": "---\ntitle: P\ndraft: false\n---\nWe store messages.\n" } }),
    );
    expect(result.status).toBe("missing");
    expect(result.details).toEqual(["privacy-policy: does not state that messages are stored in Cloudflare D1"]);
  });

  it.each(["Ghost", "Supabase", "Mailgun", "Fly.io"])("is missing when the privacy policy names %s", async (name) => {
    const result = await check(ctxFor({ pages: { "privacy-policy": `${GOOD_PRIVACY}We also use ${name} for mail.\n` } }));
    expect(result.status).toBe("missing");
    expect(result.details).toEqual([`privacy-policy: names a retired service (${name})`]);
  });

  it("is missing and names the config field when launch.expectedPages is absent", async () => {
    const result = await check(ctxFor({}, { owner: "drcdev" }));
    expect(result.status).toBe("missing");
    expect(result.summary).toContain("launch.expectedPages");
    expect(result.nextAction).toContain("setup/config.json");
  });

  it("gives one detail line per problem", async () => {
    const result = await check(
      ctxFor({
        pages: {
          about: "---\ntitle: A\ndraft: true\n---\nplaceholder copy\n",
          "privacy-policy": "---\ntitle: P\ndraft: false\n---\nCloudflare D1 and Supabase\n",
        },
        projects: { "focus-pocus": "---\nvisual:\n  placeholder: true\n---\n" },
      }),
    );
    expect(result.status).toBe("missing");
    expect(result.summary).toBe("3 launch content problem(s).");
    expect(result.details).toHaveLength(3);
  });
});
