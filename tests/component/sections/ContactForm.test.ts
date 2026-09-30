// The static markup of the contact form (contracts/contact-page.md "Static
// markup"; FR-008a to FR-008p). The island script is not run here; the
// browser behaviour is covered in tests/e2e/contact.spec.ts.
import { describe, expect, it } from "vitest";
import ContactForm from "../../../src/components/sections/ContactForm.astro";
import { EMAIL_MAX, MESSAGE_MAX, NAME_MAX, ORGANIZATION_MAX } from "../../../worker/src/contact/rules.ts";
import { byName, tags } from "../html.ts";
import { render } from "./helpers.ts";

const html = await render(ContactForm);
const byId = (id: string) => tags(html).find((t) => t.attrs.id === id);
const labelFor = (id: string) => byName(html, "label").find((t) => t.attrs.for === id);
/** The visible text of the label element that points at this control. */
function labelText(id: string): string {
  const match = new RegExp(`<label[^>]*\\bfor="${id}"[^>]*>([\\s\\S]*?)</label>`).exec(html);
  return (match?.[1] ?? "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ ([.,])/g, "$1")
    .trim();
}
const submitButton = () => byName(html, "button").find((b) => b.attrs.type === "submit")!;

describe("ContactForm form and heading", () => {
  it("names the form from a visible heading and posts to the API", () => {
    const form = byId("contact-form")!;
    expect(form.name).toBe("form");
    expect(form.attrs.action).toBe("/api/contact");
    expect(form.attrs.method).toBe("post");
    expect(form.attrs.novalidate).toBeDefined();
    expect(form.attrs["aria-labelledby"]).toBe("contact-form-heading");
    expect(byId("contact-form-heading")!.name).toBe("h2");
    expect(html).toMatch(/<h2[^>]*id="contact-form-heading"[^>]*>\s*Send a message\s*<\/h2>/);
  });

  it("adds no level-1 heading (the page layout owns it)", () => {
    expect(byName(html, "h1")).toHaveLength(0);
  });
});

describe("ContactForm fields", () => {
  it.each([
    ["contact-name", "name", "text", NAME_MAX, "name", "Name"],
    ["contact-email", "email", "email", EMAIL_MAX, "email", "Email"],
    ["contact-organization", "organization", "text", ORGANIZATION_MAX, "organization", "Organization (optional)"],
  ])("%s is labelled, limited and declares its input purpose", (id, name, type, max, autocomplete, label) => {
    const input = byId(id)!;
    expect(input.name).toBe("input");
    expect(input.attrs.name).toBe(name);
    expect(input.attrs.type ?? "text").toBe(type);
    expect(input.attrs.maxlength).toBe(String(max));
    expect(input.attrs.autocomplete).toBe(autocomplete);
    expect(labelFor(id)).toBeDefined();
    expect(labelText(id)).toBe(label);
  });

  it("marks name and email required and organization not required", () => {
    expect(byId("contact-name")!.attrs.required).toBeDefined();
    expect(byId("contact-email")!.attrs.required).toBeDefined();
    expect(byId("contact-organization")!.attrs.required).toBeUndefined();
  });

  it("has a labelled, required message box with the shared limit", () => {
    const message = byId("contact-message")!;
    expect(message.name).toBe("textarea");
    expect(message.attrs.name).toBe("message");
    expect(message.attrs.required).toBeDefined();
    expect(message.attrs.maxlength).toBe(String(MESSAGE_MAX));
    expect(message.attrs.rows).toBe("6");
    expect(labelText("contact-message")).toBe("Message");
  });

  it("says all fields are required unless marked optional, before the fields", () => {
    const note = byId("contact-required-note")!;
    expect(note.name).toBe("p");
    expect(html).toContain("All fields are required unless marked optional.");
    expect(note.index).toBeLessThan(byId("contact-name")!.index);
  });

  it("keeps the email icon but hides it from assistive technology", () => {
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it("gives each field an empty, hidden error paragraph", () => {
    for (const field of ["name", "email", "organization", "message", "consent"]) {
      const error = byId(`contact-${field}-error`);
      expect(error, field).toBeDefined();
      expect(error!.name).toBe("p");
      expect(error!.attrs.hidden).toBeDefined();
    }
  });
});

describe("ContactForm consent", () => {
  it("uses the whole sentence as the checkbox label, with the privacy link inside it", () => {
    const box = byId("contact-consent")!;
    expect(box.attrs.type).toBe("checkbox");
    expect(box.attrs.name).toBe("consent");
    expect(box.attrs.required).toBeDefined();
    expect(labelText("contact-consent")).toBe(
      "I agree that Don Coleman may keep what I enter in this form and use it to reply to me, as described in the privacy policy (opens in a new tab).",
    );
    const label = /<label[^>]*for="contact-consent"[^>]*>([\s\S]*?)<\/label>/.exec(html)![1]!;
    const link = byName(label, "a")[0]!;
    expect(link.attrs.href).toBe("/privacy-policy/");
    expect(link.attrs.target).toBe("_blank");
    expect(link.attrs.rel).toContain("noopener");
  });

  it("makes the checkbox at least 24 by 24 CSS pixels", () => {
    expect(byId("contact-consent")!.attrs.class).toMatch(/\bsize-6\b/);
  });
});

describe("ContactForm honeypot, project line and human check", () => {
  it("hides the trap field from everyone (display none, out of tab order, no autofill)", () => {
    const trap = tags(html).find((t) => t.attrs.name === "website")!;
    expect(trap.attrs.tabindex).toBe("-1");
    expect(trap.attrs.autocomplete).toBe("off");
    const wrapper = /<div([^>]*)>\s*<input[^>]*name="website"/.exec(html)!;
    expect(wrapper[1]).toContain('aria-hidden="true"');
    expect(wrapper[1]).toMatch(/class="[^"]*\bhidden\b/);
  });

  it("has a hidden project line that is plain text and a hidden project input", () => {
    const line = byId("contact-project")!;
    expect(line.name).toBe("p");
    expect(line.attrs.hidden).toBeDefined();
    expect(line.attrs.tabindex).toBeUndefined();
    expect(tags(html).find((t) => t.attrs.name === "project")!.attrs.type).toBe("hidden");
  });

  it("has an empty human-check slot carrying the public site key", () => {
    const slot = byId("contact-turnstile")!;
    expect(slot.name).toBe("div");
    expect(slot.attrs["data-sitekey"]).toMatch(/^[0-9A-Za-z_-]{10,}$/);
    expect(html).toMatch(/<div[^>]*id="contact-turnstile"[^>]*><\/div>/);
  });
});

describe("ContactForm status, submit and success", () => {
  it("has a polite status region directly above a disabled Send", () => {
    const status = byId("contact-status")!;
    expect(status.attrs.role).toBe("status");
    expect(status.attrs["aria-live"]).toBe("polite");
    const submit = submitButton();
    expect(submit.attrs.disabled).toBeDefined();
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>[\s\S]*?Send[\s\S]*?<\/button>/);
    expect(status.index).toBeLessThan(submit.index);
    expect(html.slice(status.index, submit.index)).not.toMatch(/<(input|textarea|select|a)\b/);
  });

  it("has a hidden success panel with a heading that can take focus", () => {
    const panel = byId("contact-success")!;
    expect(panel.attrs.hidden).toBeDefined();
    expect(panel.attrs.tabindex).toBe("-1");
    expect(html).toMatch(/id="contact-success"[\s\S]*<h2[^>]*id="contact-success-heading"[^>]*tabindex="-1"/);
  });
});

describe("ContactForm without JavaScript", () => {
  it("shows the JavaScript notice first, as ordinary text", () => {
    const notice = byId("contact-js-required")!;
    expect(notice.attrs.hidden).toBeUndefined();
    expect(notice.attrs["aria-hidden"]).toBeUndefined();
    expect(html).toContain("Sending this form needs JavaScript.");
    expect(html).toContain("privacy policy");
    expect(byId("contact-form")!.index).toBeLessThan(notice.index);
    expect(notice.index).toBeLessThan(byId("contact-name")!.index);
  });

  it("leaves every field enabled", () => {
    for (const t of tags(html).filter((x) => ["input", "textarea"].includes(x.name))) {
      expect(t.attrs.disabled, t.raw).toBeUndefined();
    }
  });
});

describe("ContactForm tab order (FR-008o)", () => {
  it("puts Name, Email, Organization, Message, consent, privacy link, human check, status, Send in DOM order", () => {
    const consent = byId("contact-consent")!.index;
    const order = [
      byId("contact-name")!.index,
      byId("contact-email")!.index,
      byId("contact-organization")!.index,
      byId("contact-message")!.index,
      consent,
      html.indexOf('href="/privacy-policy/"', consent),
      byId("contact-turnstile")!.index,
      byId("contact-status")!.index,
      submitButton().index,
    ];
    expect(order.every((n) => n >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("has no positive tabindex", () => {
    for (const t of tags(html)) {
      if (t.attrs.tabindex !== undefined) expect(Number(t.attrs.tabindex)).toBeLessThanOrEqual(0);
    }
  });
});
