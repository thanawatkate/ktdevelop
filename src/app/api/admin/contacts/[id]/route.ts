import { NextResponse } from "next/server";
import { ContactRepository } from "../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

function parseId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid contact id." }, { status: 400 });
    }

    const removed = await contactRepository.delete(id);
    if (!removed) {
      return NextResponse.json({ success: false, error: "Contact not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete contact.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

function parseStatus(value: unknown): "new" | "in_progress" | "closed" | null {
  if (value === "new" || value === "in_progress" || value === "closed") {
    return value;
  }
  return null;
}

function readCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";");
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (part.startsWith(`${cookieName}=`)) {
      return decodeURIComponent(part.slice(cookieName.length + 1));
    }
  }

  return null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid contact id." }, { status: 400 });
    }

    const payload = (await request.json()) as { status?: unknown };
    const status = parseStatus(payload.status);
    if (!status) {
      return NextResponse.json({ success: false, error: "Invalid status value." }, { status: 400 });
    }

    const actor = readCookieValue(request.headers.get("cookie"), "admin_actor") || "admin";
    const updated = await contactRepository.updateStatus(id, status, actor);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Contact not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update contact status.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}