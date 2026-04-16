import { NextResponse } from "next/server";
import {
  ADMIN_ACTOR_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  getAdminSessionSecret,
  getAllowedGoogleEmails,
} from "../../../../../core/security/adminAuth";
import { isDbAdminEmailAllowed } from "../../../../../core/security/adminUserAuth";

interface GoogleLoginPayload {
  credential?: unknown;
}

interface GoogleTokenInfo {
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  aud?: string;
}

function isEmailVerified(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Google login is not configured." },
        { status: 500 }
      );
    }

    const sessionSecret = getAdminSessionSecret();
    if (!sessionSecret) {
      return NextResponse.json(
        { success: false, error: "Admin session secret is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as GoogleLoginPayload;
    const credential = typeof body.credential === "string" ? body.credential.trim() : "";

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Google credential is required." },
        { status: 400 }
      );
    }

    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const verifyResponse = await fetch(verifyUrl, { method: "GET", cache: "no-store" });
    if (!verifyResponse.ok) {
      return NextResponse.json({ success: false, error: "Invalid Google token." }, { status: 401 });
    }

    const tokenInfo = (await verifyResponse.json()) as GoogleTokenInfo;
    if (!tokenInfo.aud || tokenInfo.aud !== clientId) {
      return NextResponse.json({ success: false, error: "Google client mismatch." }, { status: 401 });
    }

    const email = (tokenInfo.email || "").trim().toLowerCase();
    if (!email || !isEmailVerified(tokenInfo.email_verified)) {
      return NextResponse.json({ success: false, error: "Google email is not verified." }, { status: 401 });
    }

    const allowedEmails = getAllowedGoogleEmails();
    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      return NextResponse.json({ success: false, error: "This Google account is not allowed." }, { status: 403 });
    }

    const isDbAllowed = await isDbAdminEmailAllowed(email);
    if (!isDbAllowed) {
      return NextResponse.json({ success: false, error: "This Google account is not registered as admin." }, { status: 403 });
    }

    const actor = (tokenInfo.name || email).trim().slice(0, 80) || "admin";
    const response = NextResponse.json({ success: true, message: "Authenticated", actor });

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
  } catch {
    return NextResponse.json({ success: false, error: "Unable to process Google login." }, { status: 400 });
  }
}
