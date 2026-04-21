import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { ADMIN_COOKIE_NAME, isSessionAuthorizedByValue } from "../../../../core/security/adminAuth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, WebP, and GIF images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File size must not exceed 5MB." },
        { status: 400 }
      );
    }

    const ext = extname(file.name).toLowerCase() || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
