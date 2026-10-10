// The privacy policy states the contact-form facts of spec FR-019 and FR-012b. It
// describes email delivery: the message is sent by email and nothing is stored, so
// there is no region or retention period to state. Reads the page source directly.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../../../src/content/pages/privacy-policy.mdx", import.meta.url)),
  "utf-8",
);
const front = /^---\n([\s\S]*?)\n---\n/.exec(source)![1]!;
const body = source.slice(source.indexOf("\n---\n", 4) + 5);

function section(heading: string): string {
  const start = body.indexOf(`## ${heading}`);
  expect(start, `"${heading}" section`).toBeGreaterThanOrEqual(0);
  const rest = body.slice(start + 3);
  const next = rest.search(/\n## /);
  return (next === -1 ? rest : rest.slice(0, next)).toLowerCase();
}

describe("privacy policy: contact form", () => {
  const form = section("The contact form");

  it("lists the collected fields and why", () => {
    for (const word of ["name", "email address", "organization", "message", "project"]) expect(form).toContain(word);
    expect(form).toContain("reply");
  });

  it("names the email service and says the email is then kept in Don's mailbox with his mail provider", () => {
    expect(form).toContain("cloudflare");
    expect(form).toContain("email");
    expect(form).toContain("mailbox");
    expect(form).toContain("mail provider");
  });

  it("says the site stores nothing", () => {
    expect(form).toMatch(/this site stores nothing/);
  });

  it("says the IP address is not stored or used to limit sending but still goes to the human-check service", () => {
    expect(form).toContain("ip address");
    expect(form).toMatch(/not stored/);
    expect(form).toMatch(/not used to limit/);
    expect(form).toMatch(/human-check|turnstile/);
  });

  it("drops the old storage, region, fingerprint and retention wording", () => {
    const lower = body.toLowerCase();
    const old = lower.slice(lower.indexOf("## the contact form"), lower.indexOf("## questions about a post"));
    for (const word of ["d1", "western north america", "salted", "fingerprint", "12 months", "no email or other notification"]) {
      expect(old).not.toContain(word);
    }
    expect(lower).not.toContain("time travel");
    expect(lower).not.toContain("recovery history");
  });
});

describe("privacy policy: spam protection", () => {
  const spam = section("Spam protection");

  it("names Cloudflare Turnstile and exactly what it receives (FR-012b)", () => {
    expect(spam).toContain("cloudflare turnstile");
    expect(spam).toContain("ip address");
    expect(spam).toContain("browser and device signals");
    expect(spam).toContain("one-time token");
    expect(spam).toContain("no form field is sent");
  });

  it("links Cloudflare's Turnstile privacy addendum", () => {
    expect(spam).toContain("https://www.cloudflare.com/turnstile-privacy-policy/");
  });
});

describe("privacy policy: your choices", () => {
  const choices = section("Your choices");

  it("says Don keeps contact emails only as long as needed and deletes one on request within 30 days", () => {
    expect(choices).toContain("only as long as needed");
    expect(choices).toContain("delete");
    expect(choices).toContain("30 days");
  });

  it("explains how to ask: the form, or the address shown as a link whose text is the address", () => {
    expect(choices).toContain("contact form");
    expect(choices).toContain("[contact@doncoleman.ca](mailto:contact@doncoleman.ca)");
  });

  it("says deletion covers copies and the deleted-items folder, and backups follow the provider's terms", () => {
    expect(choices).toContain("copies");
    expect(choices).toContain("deleted-items folder");
    expect(choices).toContain("backups");
    expect(choices).toContain("provider");
  });
});

describe("privacy policy: reading questions (specs/022 FR-023)", () => {
  const questions = section("Questions about a post");

  it("names Workers AI and says only the post's own public text is sent", () => {
    expect(questions).toContain("workers ai");
    expect(questions).toMatch(/public text|own text|text of the post/);
    expect(questions).toMatch(/nothing (about you|about the reader)|no information about you/);
  });

  it("says where the questions are stored", () => {
    expect(questions).toContain("d1");
  });

  it("says Cloudflare's own logs see the reader's IP address and the site does not read them", () => {
    expect(questions).toMatch(/cloudflare[^.]*(platform )?logs/);
    expect(questions).toContain("ip address");
    expect(questions).toMatch(/(not read|does not read|never read)/);
    expect(questions).toMatch(/no personal data|collects no personal/);
  });
});

describe("privacy policy: whole page", () => {
  it("has no leftover placeholders", () => {
    expect(body.toLowerCase()).not.toContain("to be confirmed");
    expect(body.toLowerCase()).not.toContain("when the contact form is available");
  });

  it("is published and shows a Last updated date", () => {
    expect(front).not.toMatch(/^draft: true$/m);
    expect(body).toMatch(/\*\*Last updated:\*\* \d{1,2} \w+ \d{4}/);
  });

  it("has a current Last updated day (this change is dated 10 October 2026)", () => {
    expect(body).toContain("**Last updated:** 10 October 2026");
  });
});
