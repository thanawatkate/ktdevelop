import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";

const locales = ["th", "en"];
const defaultLocale = "th";

// next-intl middleware สำหรับ i18n routing
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

function getExpectedToken(): string | null {
  const token = process.env.ADMIN_ACCESS_TOKEN?.trim();
  return token || null;
}

function getProvidedToken(request: NextRequest): string | null {
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-admin-token")?.trim();
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value?.trim();

  return bearerToken || headerToken || cookieToken || null;
}

function isAdminAuthorized(request: NextRequest): boolean {
  const expectedToken = getExpectedToken();
  const providedToken = getProvidedToken(request);

  if (!expectedToken || !providedToken) {
    return false;
  }

  return providedToken === expectedToken;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ปล่อย login routes โดยไม่ต้องตรวจสอบสิทธิ์
  if (pathname === "/admin/login" || pathname.includes("/admin/login") || pathname === "/api/admin/login") {
    return intlMiddleware(request);
  }

  // ตรวจสอบ admin routes
  if (pathname.includes("/admin") || pathname.includes("/api/admin")) {
    if (!isAdminAuthorized(request)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(th|en)/:path*",
    "/((?!_next|_vercel|.*\\..*|api/contact|api/portfolios).*)",
  ],
};