// Shared limits and validation. Runtime-agnostic: the Worker and the Astro form
// component both import this file (data-model.md, "Value object: Submission").

export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const ORGANIZATION_MAX = 100;
export const PROJECT_MAX = 100;
export const MESSAGE_MAX = 5000;
export const BODY_MAX_BYTES = 10_240;

export type FieldError = "required" | "too_long" | "invalid";

export interface ValidSubmission {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  project: string | null;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: ValidSubmission }
  | { ok: false; fields: Record<string, FieldError> };

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateSubmission(input: unknown): ValidationResult {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const fields: Record<string, FieldError> = {};

  const id = typeof body.submission_id === "string" ? body.submission_id : "";
  if (!UUID_V4.test(id)) fields.submission_id = "invalid";

  const name = text(body.name);
  if (name === "") fields.name = "required";
  else if (name.length > NAME_MAX) fields.name = "too_long";

  const email = text(body.email);
  if (email === "") fields.email = "required";
  else if (email.length > EMAIL_MAX) fields.email = "too_long";
  else if (!EMAIL_FORMAT.test(email)) fields.email = "invalid";

  const organization = text(body.organization);
  if (organization.length > ORGANIZATION_MAX) fields.organization = "too_long";

  const project = text(typeof body.project === "string" ? body.project.replace(CONTROL_CHARACTERS, "") : "");
  if (project.length > PROJECT_MAX) fields.project = "too_long";

  const message = text(body.message);
  if (message === "") fields.message = "required";
  else if (message.length > MESSAGE_MAX) fields.message = "too_long";

  if (body.consent !== true) fields.consent = "required";

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: {
      id,
      name,
      email,
      organization: organization === "" ? null : organization,
      project: project === "" ? null : project,
      message,
    },
  };
}
