// The privacy policy states the contact-form facts of spec FR-019 and FR-012b, and
// takes the retention period from the shared rules so the policy and the Worker
// cannot drift apart (FR-019a). Reads the page source directly.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RETENTION_MONTHS } from "../../../worker/src/contact/rules.ts";

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

  it("states Cloudflare D1 in Western North America and not Canada", () => {
    expect(form).toContain("cloudflare d1");
    expect(form).toContain("western north america");
    expect(form).toContain("cannot be limited to canada");
  });

  it("states the retention period from the shared rules, read or not", () => {
    expect(form).toContain(`${RETENTION_MONTHS} months`);
    expect(form).toContain("whether they have been read or not");
  });

  it("describes the IP fingerprint: only to limit repeat sending, one-way, salted, gone after about two days", () => {
    expect(form).toContain("ip address");
    expect(form).toContain("limit repeat sending");
    expect(form).toContain("one-way");
    expect(form).toContain("salted");
    expect(form).toContain("about two days");
  });

  it("says no notification email is sent", () => {
    expect(form).toContain("no email or other notification");
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

  it("gives the deletion request route, the 30-day answer and the 7-day recovery history", () => {
    expect(choices).toContain("contact form");
    expect(choices).toContain("contact@doncoleman.ca");
    expect(choices).toContain("30 days");
    expect(choices).toContain("time travel");
    expect(choices).toContain("7 days");
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

  it("stays a draft and shows a Last updated date", () => {
    expect(front).toMatch(/^draft: true$/m);
    expect(body).toMatch(/\*\*Last updated:\*\* \d{1,2} \w+ \d{4}/);
  });
});
