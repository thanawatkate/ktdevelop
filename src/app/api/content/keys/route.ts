import { NextResponse } from "next/server";
import { ContentRepository } from "../../../../infrastructure/repositories/ContentRepository";
import { ADMIN_COOKIE_NAME, isSessionAuthorizedByValue } from "../../../../core/security/adminAuth";

const contentRepository = new ContentRepository();

function readCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const p = part.trim();
    if (p.startsWith(`${cookieName}=`)) return decodeURIComponent(p.slice(cookieName.length + 1)).trim();
  }
  return null;
}

function isAuthorized(request: Request): boolean {
  const cookie = readCookieValue(request.headers.get("cookie"), ADMIN_COOKIE_NAME);
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || null;
  return isSessionAuthorizedByValue(bearer || cookie);
}

export async function DELETE(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as { locale?: unknown; section?: unknown; keys?: unknown };
    const locale = typeof payload.locale === "string" ? payload.locale.trim() : "";
    const section = typeof payload.section === "string" ? payload.section.trim() : "";

    if (!locale || !section) {
      return NextResponse.json({ success: false, error: "locale and section are required." }, { status: 400 });
    }

    if (!Array.isArray(payload.keys) || payload.keys.length === 0) {
      return NextResponse.json({ success: false, error: "keys must be a non-empty array." }, { status: 400 });
    }

    const keys = (payload.keys as unknown[]).filter((k): k is string => typeof k === "string" && k.trim().length > 0);
    if (keys.length === 0) {
      return NextResponse.json({ success: false, error: "No valid keys provided." }, { status: 400 });
    }

    const ok = await contentRepository.deleteKeys(locale, section, keys);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Unable to delete keys." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete keys.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
