import { NextResponse } from "next/server";
import { PortfolioRepository } from "../../../../../infrastructure/repositories/PortfolioRepository";
import { ADMIN_COOKIE_NAME, isSessionAuthorizedByValue } from "../../../../../core/security/adminAuth";

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

interface UpdatePortfolioPayload {
  title?: unknown;
  description?: unknown;
  client_name?: unknown;
  image_url?: unknown;
  is_published?: unknown;
}

function parseId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid portfolio id." }, { status: 400 });
    }

    const payload = (await request.json()) as UpdatePortfolioPayload;
    const updated = await portfolioRepository.update(id, {
      title: typeof payload.title === "string" ? payload.title : undefined,
      description: typeof payload.description === "string" ? payload.description : undefined,
      client_name: typeof payload.client_name === "string" ? payload.client_name : undefined,
      image_url: typeof payload.image_url === "string" ? payload.image_url : undefined,
      is_published: typeof payload.is_published === "boolean" ? payload.is_published : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Portfolio not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update portfolio.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid portfolio id." }, { status: 400 });
    }

    const removed = await portfolioRepository.delete(id);
    if (!removed) {
      return NextResponse.json({ success: false, error: "Portfolio not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete portfolio.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}