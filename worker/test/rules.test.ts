import { describe, expect, it } from "vitest";
import {
  BODY_MAX_BYTES,
  EMAIL_MAX,
  MESSAGE_MAX,
  NAME_MAX,
  ORGANIZATION_MAX,
  PROJECT_MAX,
  validateSubmission,
} from "../src/contact/rules";

const valid = {
  submission_id: "3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b",
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello there",
  consent: true,
};

describe("limits", () => {
  it("match the data model", () => {
    expect(NAME_MAX).toBe(100);
    expect(EMAIL_MAX).toBe(254);
    expect(ORGANIZATION_MAX).toBe(100);
    expect(PROJECT_MAX).toBe(100);
    expect(MESSAGE_MAX).toBe(5000);
    expect(BODY_MAX_BYTES).toBe(10_240);
  });
});

describe("validateSubmission", () => {
  it("accepts a minimal valid submission and nulls the optional fields", () => {
    const result = validateSubmission(valid);
    expect(result).toEqual({
      ok: true,
      value: {
        id: valid.submission_id,
        name: "Ada Lovelace",
        email: "ada@example.com",
        organization: null,
        project: null,
        message: "Hello there",
      },
    });
  });

  it("trims values and keeps optional fields when present", () => {
    const result = validateSubmission({
      ...valid,
      name: "  Ada  ",
      organization: " Analytical Engines ",
      project: " Flux ",
    });
    expect(result.ok && result.value.name).toBe("Ada");
    expect(result.ok && result.value.organization).toBe("Analytical Engines");
    expect(result.ok && result.value.project).toBe("Flux");
  });

  it("removes control characters from project", () => {
    const result = validateSubmission({ ...valid, project: "Fl\u0000u\u0007x\n" });
    expect(result.ok && result.value.project).toBe("Flux");
  });

  it("treats a control-only project as absent", () => {
    const result = validateSubmission({ ...valid, project: "\u0000\u0001" });
    expect(result.ok && result.value.project).toBeNull();
  });

  it("treats whitespace-only required fields as empty", () => {
    const result = validateSubmission({ ...valid, name: "   ", message: " \n\t " });
    expect(result).toEqual({ ok: false, fields: { name: "required", message: "required" } });
  });

  it("collects every error", () => {
    const result = validateSubmission({
      submission_id: "nope",
      name: "x".repeat(NAME_MAX + 1),
      email: "not-an-email",
      organization: "o".repeat(ORGANIZATION_MAX + 1),
      project: "p".repeat(PROJECT_MAX + 1),
      message: "m".repeat(MESSAGE_MAX + 1),
      consent: false,
    });
    expect(result).toEqual({
      ok: false,
      fields: {
        submission_id: "invalid",
        name: "too_long",
        email: "invalid",
        organization: "too_long",
        project: "too_long",
        message: "too_long",
        consent: "required",
      },
    });
  });

  it("allows values exactly at the limits", () => {
    const email = `${"a".repeat(EMAIL_MAX - "@b.co".length)}@b.co`;
    expect(email).toHaveLength(EMAIL_MAX);
    const result = validateSubmission({
      ...valid,
      name: "n".repeat(NAME_MAX),
      email,
      organization: "o".repeat(ORGANIZATION_MAX),
      project: "p".repeat(PROJECT_MAX),
      message: "m".repeat(MESSAGE_MAX),
    });
    expect(result.ok).toBe(true);
  });

  it("refuses an email over the limit as too_long", () => {
    const result = validateSubmission({ ...valid, email: `${"a".repeat(EMAIL_MAX)}@b.co` });
    expect(result).toEqual({ ok: false, fields: { email: "too_long" } });
  });

  it("requires an email and refuses malformed ones", () => {
    expect(validateSubmission({ ...valid, email: "" })).toEqual({ ok: false, fields: { email: "required" } });
    for (const email of ["a@b", "a b@c.d", "@b.c", "a@@b.c", "ab.c"]) {
      expect(validateSubmission({ ...valid, email })).toEqual({ ok: false, fields: { email: "invalid" } });
    }
  });

  it("requires consent to be exactly true", () => {
    for (const consent of [false, "true", 1, undefined, null]) {
      expect(validateSubmission({ ...valid, consent })).toEqual({
        ok: false,
        fields: { consent: "required" },
      });
    }
  });

  it("requires a lowercase UUID v4 submission_id", () => {
    for (const id of [undefined, "", "3F2B8C1E-5D4A-4B6F-9A7E-1C2D3E4F5A6B", "3f2b8c1e-5d4a-1b6f-9a7e-1c2d3e4f5a6b"]) {
      expect(validateSubmission({ ...valid, submission_id: id })).toEqual({
        ok: false,
        fields: { submission_id: "invalid" },
      });
    }
  });

  it("treats non-string values as required, never throwing", () => {
    expect(validateSubmission({ ...valid, name: 5, message: null })).toEqual({
      ok: false,
      fields: { name: "required", message: "required" },
    });
    expect(validateSubmission({ ...valid, organization: 5 }).ok).toBe(true);
  });

  it("ignores unknown fields", () => {
    expect(validateSubmission({ ...valid, extra: "x", website: "" }).ok).toBe(true);
  });
});
