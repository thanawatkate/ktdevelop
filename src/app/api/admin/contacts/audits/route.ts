import { NextResponse } from "next/server";
import { ContactRepository } from "../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "20");
    const page = Number(searchParams.get("page") || "1");
    const contactId = Number(searchParams.get("contactId") || "0");

    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 20;
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (safePage - 1) * safeLimit;

    const audits = await contactRepository.getStatusAudits({
      limit: safeLimit,
      offset,
      contactId,
    });

    return NextResponse.json({
      success: true,
      data: audits,
      meta: {
        page: safePage,
        limit: safeLimit,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load contact status audits.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}