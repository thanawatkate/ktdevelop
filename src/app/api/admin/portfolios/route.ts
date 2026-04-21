import { NextResponse } from "next/server";
import { PortfolioRepository } from "../../../../infrastructure/repositories/PortfolioRepository";
import { ADMIN_COOKIE_NAME, isSessionAuthorizedByValue } from "../../../../core/security/adminAuth";

const portfolioRepository = new PortfolioRepository();

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

interface CreatePortfolioPayload {
  title?: unknown;
  description?: unknown;
  client_name?: unknown;
  image_url?: unknown;
  is_published?: unknown;
}

export async function GET() {
  try {
    const rows = await portfolioRepository.getAll();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch portfolios.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CreatePortfolioPayload;

    if (typeof payload.title !== "string" || typeof payload.description !== "string" || typeof payload.client_name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "title, description, and client_name are required.",
        },
        { status: 400 }
      );
    }

    const created = await portfolioRepository.create({
      title: payload.title,
      description: payload.description,
      client_name: payload.client_name,
      image_url: typeof payload.image_url === "string" ? payload.image_url : null,
      is_published: payload.is_published === true,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create portfolio.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}