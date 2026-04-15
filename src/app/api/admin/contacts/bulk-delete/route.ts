import { NextResponse } from "next/server";
import { ContactRepository } from "../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

interface BulkDeletePayload {
  ids?: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as BulkDeletePayload;
    const ids = Array.isArray(payload.ids)
      ? payload.ids.filter((value): value is number => Number.isInteger(value) && value > 0)
      : [];

    if (ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one valid contact id is required.",
        },
        { status: 400 }
      );
    }

    const deletedCount = await contactRepository.deleteMany(ids);
    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete selected contacts.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}