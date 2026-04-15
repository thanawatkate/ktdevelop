import { NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";
const ADMIN_ACTOR_COOKIE_NAME = "admin_actor";

interface LoginPayload {
  token?: unknown;
  actor?: unknown;
}

function sanitizeActor(value: unknown): string {
  if (typeof value !== "string") {
    return "admin";
  }

  const actor = value.trim().replace(/\s+/g, " ").slice(0, 80);
  return actor || "admin";
}

export async function POST(request: Request) {
  try {
    const expectedToken = process.env.ADMIN_ACCESS_TOKEN?.trim();
    if (!expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin token is not configured.",
        },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as LoginPayload;
    const providedToken = typeof payload.token === "string" ? payload.token.trim() : "";
    const actor = sanitizeActor(payload.actor);

    if (!providedToken || providedToken !== expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin token.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Authenticated",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: expectedToken,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    response.cookies.set({
      name: ADMIN_ACTOR_COOKIE_NAME,
      value: actor,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request payload.",
      },
      { status: 400 }
    );
  }
}