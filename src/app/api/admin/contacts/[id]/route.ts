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

    const payload = (await request.json()) as {
      status?: unknown;
      sender_name?: unknown;
      email?: unknown;
      phone?: unknown;
      line_id?: unknown;
      facebook_url?: unknown;
      instagram_handle?: unknown;
      subject?: unknown;
      message?: unknown;
    };

    const hasProfileFields =
      payload.sender_name !== undefined ||
      payload.email !== undefined ||
      payload.phone !== undefined ||
      payload.line_id !== undefined ||
      payload.facebook_url !== undefined ||
      payload.instagram_handle !== undefined ||
      payload.subject !== undefined ||
      payload.message !== undefined;

    const actor = readCookieValue(request.headers.get("cookie"), "admin_actor") || "admin";
    const parsedStatus = payload.status === undefined ? undefined : parseStatus(payload.status);

    if (payload.status !== undefined && !parsedStatus) {
      return NextResponse.json({ success: false, error: "Invalid status value." }, { status: 400 });
    }

    let updated = null;

    if (hasProfileFields) {
      if (payload.sender_name !== undefined && typeof payload.sender_name !== "string") {
        return NextResponse.json({ success: false, error: "Invalid sender_name value." }, { status: 400 });
      }
      if (payload.email !== undefined && typeof payload.email !== "string") {
        return NextResponse.json({ success: false, error: "Invalid email value." }, { status: 400 });
      }
      if (payload.phone !== undefined && payload.phone !== null && typeof payload.phone !== "string") {
        return NextResponse.json({ success: false, error: "Invalid phone value." }, { status: 400 });
      }
      if (payload.line_id !== undefined && payload.line_id !== null && typeof payload.line_id !== "string") {
        return NextResponse.json({ success: false, error: "Invalid line_id value." }, { status: 400 });
      }
      if (payload.facebook_url !== undefined && payload.facebook_url !== null && typeof payload.facebook_url !== "string") {
        return NextResponse.json({ success: false, error: "Invalid facebook_url value." }, { status: 400 });
      }
      if (payload.instagram_handle !== undefined && payload.instagram_handle !== null && typeof payload.instagram_handle !== "string") {
        return NextResponse.json({ success: false, error: "Invalid instagram_handle value." }, { status: 400 });
      }
      if (payload.subject !== undefined && typeof payload.subject !== "string") {
        return NextResponse.json({ success: false, error: "Invalid subject value." }, { status: 400 });
      }
      if (payload.message !== undefined && typeof payload.message !== "string") {
        return NextResponse.json({ success: false, error: "Invalid message value." }, { status: 400 });
      }

      updated = await contactRepository.update(id, {
        sender_name: payload.sender_name as string | undefined,
        email: payload.email as string | undefined,
        phone: payload.phone as string | null | undefined,
        line_id: payload.line_id as string | null | undefined,
        facebook_url: payload.facebook_url as string | null | undefined,
        instagram_handle: payload.instagram_handle as string | null | undefined,
        subject: payload.subject as string | undefined,
        message: payload.message as string | undefined,
      });

      if (parsedStatus) {
        await contactRepository.updateStatus(id, parsedStatus, actor);
        updated = await contactRepository.getById(id);
      }
    } else {
      if (!parsedStatus) {
        return NextResponse.json({ success: false, error: "No updatable fields provided." }, { status: 400 });
      }

      updated = await contactRepository.updateStatus(id, parsedStatus, actor);
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: "Contact not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update contact status.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}