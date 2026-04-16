import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isSessionAuthorizedByValue } from "./src/core/security/adminAuth";

const locales = ["th", "en"];
const defaultLocale = "th";

// next-intl middleware สำหรับ i18n routing
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

function getProvidedToken(request: NextRequest): string | null {
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-admin-token")?.trim();
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value?.trim();

  return bearerToken || headerToken || cookieToken || null;
}

function isAdminAuthorized(request: NextRequest): boolean {
  const providedToken = getProvidedToken(request);
  return isSessionAuthorizedByValue(providedToken);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ปล่อย login routes โดยไม่ต้องตรวจสอบสิทธิ์
  if (pathname === "/admin/login" || pathname.includes("/admin/login") || pathname.startsWith("/api/admin/login")) {
    return intlMiddleware(request);
  }

  // หน้า /admin ให้เข้าได้เพื่อเปิด popup login ในหน้าเดิม
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return intlMiddleware(request);
  }

  // ตรวจสอบ API admin routes และตอบแบบ API response แทน redirect
  if (pathname.startsWith("/api/admin")) {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/",
    "/(th|en)/:path*",
    "/((?!_next|_vercel|.*\\..*|api/contact|api/portfolios).*)",
  ],
};