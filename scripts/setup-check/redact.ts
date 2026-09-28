// Shared redaction for provider error text (FR-024, FR-030): a message that
// would otherwise contain a secret value has the value replaced with
// "[redacted]"; the message still names what is wrong.
const TOKEN_LIKE_PATTERN = /\b((?:Bearer|token)[\s:=]+)([A-Za-z0-9\-_.]{16,})/gi;

export function redact(text: string, knownSecretValues: Array<string | undefined> = []): string {
  let result = text;
  for (const value of knownSecretValues) {
    if (value && value.length >= 4) {
      result = result.split(value).join("[redacted]");
    }
  }
  result = result.replace(TOKEN_LIKE_PATTERN, (_match, prefix: string) => `${prefix}[redacted]`);
  return result;
}
