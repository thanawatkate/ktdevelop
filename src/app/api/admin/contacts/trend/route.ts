import { NextResponse } from "next/server";
import { ContactRepository } from "../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

function parseDays(raw: string | null): number {
  const value = Number(raw || "7");
  if (!Number.isFinite(value)) {
    return 7;
  }

  const normalized = Math.floor(value);
  if (normalized === 30) {
    return 30;
  }

  return 7;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams.get("days"));
    const data = await contactRepository.getLeadTrend(days);
    const comparisonData = await contactRepository.getLeadTrend(days * 2);

    const currentTotal = data.reduce((sum, point) => sum + point.total, 0);
    const previousWindow = comparisonData.slice(0, days);
    const previousTotal = previousWindow.reduce((sum, point) => sum + point.total, 0);
    const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null;

    return NextResponse.json({
      success: true,
      data,
      meta: {
        days,
        comparison: {
          currentTotal,
          previousTotal,
          changePercent,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load lead trend.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
