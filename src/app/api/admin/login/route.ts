import { NextResponse } from "next/server";
import {
  ADMIN_ACTOR_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  getAdminSessionSecret,
  sanitizeActor,
} from "../../../../core/security/adminAuth";
import { validateDbAdminPasswordLogin } from "../../../../core/security/adminUserAuth";

interface LoginPayload {
  username?: unknown;
  password?: unknown;
  actor?: unknown;
}

export async function POST(request: Request) {
  try {
    const sessionSecret = getAdminSessionSecret();
    if (!sessionSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin session secret is not configured.",
        },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as LoginPayload;
    const username = typeof payload.username === "string" ? payload.username.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    const actor = sanitizeActor(payload.actor || username);

    const passwordOk = Boolean(username && password && (await validateDbAdminPasswordLogin(username, password)));

    if (!passwordOk) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username/password.",
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
      value: sessionSecret,
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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid request payload.",
      },
      { status: 400 }
    );
  }
}