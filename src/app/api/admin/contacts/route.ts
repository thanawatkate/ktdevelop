import { NextResponse } from "next/server";
import { ContactRepository } from "../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

function parseStatus(value: string): "all" | "new" | "in_progress" | "closed" {
  if (value === "new" || value === "in_progress" || value === "closed") {
    return value;
  }

  return "all";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const fromDate = searchParams.get("from") || "";
    const toDate = searchParams.get("to") || "";
    const status = parseStatus(searchParams.get("status") || "all");
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20;
    const offset = (safePage - 1) * safeLimit;

    const contacts = await contactRepository.getAllWithFilters({
      search,
      fromDate,
      toDate,
      status,
      limit: safeLimit,
      offset,
    });
    const total = await contactRepository.countWithFilters({
      search,
      fromDate,
      toDate,
      status,
    });
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return NextResponse.json({
      success: true,
      data: contacts,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch contacts.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}