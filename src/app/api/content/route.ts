import { NextResponse } from "next/server";
import { ContentRepository } from "../../../infrastructure/repositories/ContentRepository";

const contentRepository = new ContentRepository();
const ADMIN_COOKIE_NAME = "admin_session";

function getExpectedToken(): string | null {
  const token = process.env.ADMIN_ACCESS_TOKEN?.trim();
  return token || null;
}

function readCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";");
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (part.startsWith(`${cookieName}=`)) {
      return decodeURIComponent(part.slice(cookieName.length + 1)).trim();
    }
  }

  return null;
}

function getProvidedToken(request: Request): string | null {
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || null;
  const headerToken = request.headers.get("x-admin-token")?.trim() || null;
  const cookieToken = readCookieValue(request.headers.get("cookie"), ADMIN_COOKIE_NAME);
  return bearerToken || headerToken || cookieToken;
}

function isAuthorized(request: Request): boolean {
  const expectedToken = getExpectedToken();
  const providedToken = getProvidedToken(request);
  if (!expectedToken || !providedToken) {
    return false;
  }
  return expectedToken === providedToken;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "th";
    const section = searchParams.get("section");

    // ถ้ามี section ก็ดึงข้อมูลเฉพาะ section นั้น
    if (section) {
      const content = await contentRepository.getBySection(locale, section);
      return NextResponse.json({
        success: true,
        locale,
        section,
        data: content,
      });
    }

    // ถ้าไม่มี section ดึงข้อมูลทั้งหมด
    const allSections = await contentRepository.getAllSections(locale);
    return NextResponse.json({
      success: true,
      locale,
      data: allSections,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch content.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

interface UpdateContentPayload {
  locale?: unknown;
  section?: unknown;
  entries?: unknown;
}

export async function PATCH(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as UpdateContentPayload;
    const locale = typeof payload.locale === "string" ? payload.locale.trim() : "";
    const section = typeof payload.section === "string" ? payload.section.trim() : "";

    if (!locale || !section) {
      return NextResponse.json(
        { success: false, error: "locale and section are required." },
        { status: 400 }
      );
    }

    if (!payload.entries || typeof payload.entries !== "object" || Array.isArray(payload.entries)) {
      return NextResponse.json(
        { success: false, error: "entries must be an object." },
        { status: 400 }
      );
    }

    const sanitizedEntries: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload.entries as Record<string, unknown>)) {
      if (typeof value === "string") {
        sanitizedEntries[key] = value;
      }
    }

    if (Object.keys(sanitizedEntries).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid entries provided." },
        { status: 400 }
      );
    }

    const ok = await contentRepository.upsertMany(locale, section, sanitizedEntries);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Unable to update content." }, { status: 500 });
    }

    const updated = await contentRepository.getBySection(locale, section);
    return NextResponse.json({ success: true, locale, section, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update content.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
