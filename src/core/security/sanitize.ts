function stripControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeTextInput(value: string, maxLength: number): string {
  const normalized = collapseWhitespace(stripControlCharacters(value));
  return normalized.slice(0, maxLength);
}

export function sanitizeMultilineInput(value: string, maxLength: number): string {
  const normalized = stripControlCharacters(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized.slice(0, maxLength);
}

export function sanitizeEmail(value: string): string {
  return sanitizeTextInput(value, 255).toLowerCase();
}

export function sanitizeOptionalUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = sanitizeTextInput(value, 500);

  if (!normalized) {
    return null;
  }

  return normalized;
}