import { timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_ACTOR_COOKIE_NAME = "admin_actor";

export function getAdminSessionSecret(): string | null {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_ACCESS_TOKEN?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    null;
  return secret;
}

export function getConfiguredAdminUsername(): string | null {
  return process.env.ADMIN_USERNAME?.trim() || null;
}

export function getConfiguredAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

export function getConfiguredAdminToken(): string | null {
  return process.env.ADMIN_ACCESS_TOKEN?.trim() || null;
}

export function getAllowedGoogleEmails(): string[] {
  const raw = process.env.ADMIN_GOOGLE_EMAILS?.trim() || "";
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function sanitizeActor(value: unknown): string {
  if (typeof value !== "string") {
    return "admin";
  }

  const actor = value.trim().replace(/\s+/g, " ").slice(0, 80);
  return actor || "admin";
}

/**
 * Compares two strings in constant time to prevent timing attacks.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  // Buffers must have equal length for timingSafeEqual; if not, we know
  // they differ — but still run the comparison on equal-length pads to
  // avoid leaking which side is shorter.
  if (aBuf.length !== bBuf.length) {
    // Run a dummy comparison so execution time stays constant.
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function isSessionAuthorizedByValue(provided: string | null): boolean {
  const expected = getAdminSessionSecret();
  if (!expected || !provided) {
    return false;
  }
  return timingSafeStringEqual(expected, provided);
}

export function validatePasswordLogin(username: string, password: string): boolean {
  const configuredUsername = getConfiguredAdminUsername();
  const configuredPassword = getConfiguredAdminPassword();
  if (!configuredUsername || !configuredPassword) {
    return false;
  }
  return timingSafeStringEqual(username, configuredUsername) &&
    timingSafeStringEqual(password, configuredPassword);
}

export function validateTokenLogin(token: string): boolean {
  const configuredToken = getConfiguredAdminToken();
  if (!configuredToken) {
    return false;
  }
  return timingSafeStringEqual(token, configuredToken);
}
