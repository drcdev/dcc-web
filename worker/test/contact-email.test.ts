import { describe, expect, it } from "vitest";
import {
  buildContactEmail,
  CONTACT_DESTINATION,
  CONTACT_SENDER,
  CONTACT_SENDER_NAME,
  headerText,
  safeReplyTo,
} from "../src/contact/email";
import type { ValidSubmission } from "../src/contact/rules";

const RECEIVED_AT = Date.parse("2026-10-10T17:04:11.789Z");

function submission(overrides: Partial<ValidSubmission> = {}): ValidSubmission {
  return {
    id: "6f1c2b0e-8f55-4c3a-9d7e-2b1f0a9c8d7e",
    name: "Ada Lovelace",
    email: "ada@example.com",
    organization: null,
    project: null,
    message: "Hello there",
    ...overrides,
  };
}

const options = { receivedAt: RECEIVED_AT, preview: false, host: "doncoleman.ca" };

function build(overrides: Partial<ValidSubmission> = {}, extra: Partial<typeof options> = {}) {
  return buildContactEmail(submission(overrides), { ...options, ...extra });
}

describe("buildContactEmail: fields", () => {
  it("sends to the constant destination from the constant sender, as plain text only", () => {
    const email = build();
    expect(email.to).toBe(CONTACT_DESTINATION);
    expect(email.from).toEqual({ email: CONTACT_SENDER, name: CONTACT_SENDER_NAME });
    expect(email.replyTo).toBe("ada@example.com");
    expect(typeof email.text).toBe("string");
    for (const key of ["cc", "bcc", "html", "headers", "attachments"]) {
      expect(email, key).not.toHaveProperty(key);
    }
  });

  it("lays the body out with every field and 'not given' fallbacks", () => {
    expect(build().text).toBe(
      [
        "Name: Ada Lovelace",
        "Email: ada@example.com",
        "Organization: not given",
        "Project: not given",
        "Received: 2026-10-10T17:04:11Z",
        "",
        "Message:",
        "Hello there",
        "",
      ].join("\n"),
    );
  });

  it("shows organization and project when given, and keeps the message verbatim with line breaks", () => {
    const text = build({ organization: "Analytical Engines", project: "Flux", message: "Line one\n\n  Line <b>two</b>" }).text;
    expect(text).toContain("Organization: Analytical Engines\n");
    expect(text).toContain("Project: Flux\n");
    expect(text).toContain("Message:\nLine one\n\n  Line <b>two</b>\n");
  });

  it("still goes to the constant destination when the visitor uses the destination address or domain", () => {
    for (const address of [CONTACT_DESTINATION, "someone@doncoleman.ca"]) {
      const email = build({ email: address });
      expect(email.to).toBe(CONTACT_DESTINATION);
      expect(email.replyTo).toBe(address);
    }
  });
});

describe("safeReplyTo", () => {
  it("accepts a plain address", () => {
    expect(safeReplyTo("ada@example.com")).toBe("ada@example.com");
    expect(safeReplyTo("a.b+tag@sub.example.co")).toBe("a.b+tag@sub.example.co");
  });

  it("rejects anything that could become a second address, a display name or a header", () => {
    const bad = [
      "a@b@c.d",
      "no-at-sign",
      "a b@c.d",
      "a\tb@c.d",
      "a\r\n@c.d",
      "a\u0000@c.d",
      "a\u007f@c.d",
      "<a@c.d>",
      "a@c.d>",
      "a@c.d,b@c.d",
      "a@c.d;b@c.d",
      'a"b@c.d',
      "a(b)@c.d",
      "a\\b@c.d",
    ];
    for (const value of bad) expect(safeReplyTo(value), JSON.stringify(value)).toBeUndefined();
  });

  it("leaves the replyTo key out when the address is unsafe", () => {
    const email = build({ email: "a@c.d,b@c.d" });
    expect(email).not.toHaveProperty("replyTo");
  });
});

describe("headerText and the subject", () => {
  it("turns a header injection attempt into one line", () => {
    expect(headerText("Ada\r\nBcc: x@y.z")).toBe("Ada Bcc: x@y.z");
    expect(build({ name: "Ada\r\nBcc: x@y.z" }).subject).toBe("Contact form: Ada Bcc: x@y.z");
  });

  it("replaces TAB, DEL to APC, NEL, LS and PS with a space, collapses runs and trims", () => {
    expect(headerText("a\tb")).toBe("a b");
    expect(headerText("a\u0085b")).toBe("a b");
    for (let code = 0x7f; code <= 0x9f; code += 1) {
      expect(headerText(`a${String.fromCharCode(code)}b`), code.toString(16)).toBe("a b");
    }
    expect(headerText("a b")).toBe("a b");
    expect(headerText("a b")).toBe("a b");
    expect(headerText("  a     b  ")).toBe("a b");
  });

  it("builds the subject examples from the contract", () => {
    expect(build().subject).toBe("Contact form: Ada Lovelace");
    expect(build({ name: "Ada\u0085Bcc: x" }).subject).toBe("Contact form: Ada Bcc: x");
    expect(build({ name: "Ada Bcc: x", project: "Flux  X" }).subject).toBe(
      "Contact form: Ada Bcc: x (about Flux X)",
    );
    expect(build({ name: "Ada", project: "Flux" }).subject).toBe("Contact form: Ada (about Flux)");
  });

  it("adds '(about ...)' only when a project is set", () => {
    expect(build({ project: null }).subject).not.toContain("about");
    expect(build({ project: "Flux" }).subject).toContain("(about Flux)");
  });

  it("stays within 260 characters with a 100-character name and project", () => {
    const subject = build({ name: "n".repeat(100), project: "p".repeat(100) }, { preview: true }).subject;
    expect(subject.length).toBeLessThanOrEqual(260);
    expect(subject).toContain("n".repeat(100));
    expect(subject).toContain("p".repeat(100));
  });
});

describe("buildContactEmail: preview marking (FR-016)", () => {
  it("prefixes the subject and opens the body with the host and a blank line when preview", () => {
    const email = build({}, { preview: true, host: "br-x-dcc-web.example.workers.dev" });
    expect(email.subject).toBe("[Preview] Contact form: Ada Lovelace");
    const lines = (email.text as string).split("\n");
    expect(lines[0]).toContain("br-x-dcc-web.example.workers.dev");
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe("Name: Ada Lovelace");
  });

  it("adds neither marker when not preview", () => {
    const email = build({}, { preview: false });
    expect(email.subject).not.toContain("Preview");
    expect((email.text as string).startsWith("Name: Ada Lovelace\n")).toBe(true);
  });
});
