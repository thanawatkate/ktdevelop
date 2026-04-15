import { ContactRepository } from "../../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

function parseDays(raw: string | null): 7 | 30 {
  const value = Number(raw || "7");
  if (Number.isFinite(value) && Math.floor(value) === 30) {
    return 30;
  }
  return 7;
}

function parseWindow(raw: string | null): "current" | "previous" {
  return raw === "previous" ? "previous" : "current";
}

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams.get("days"));
    const window = parseWindow(searchParams.get("window"));

    const currentTrend = await contactRepository.getLeadTrend(days);
    const previousTrend = window === "previous"
      ? await contactRepository.getLeadTrend(days * 2).then((data) => data.slice(0, days))
      : null;

    const currentSum = currentTrend.reduce((s, p) => s + p.total, 0);
    const previousSum = previousTrend ? previousTrend.reduce((s, p) => s + p.total, 0) : null;
    const changePercent =
      previousSum !== null && previousSum > 0
        ? (((currentSum - previousSum) / previousSum) * 100).toFixed(1)
        : null;

    const targetTrend = window === "previous" && previousTrend ? previousTrend : currentTrend;
    const labelPrefix = window === "previous" ? "previous_window" : "current_window";

    const header =
      window === "previous"
        ? ["date", "total_leads"]
        : ["date", "total_leads", "period_total", "vs_previous_total", "change_percent"];

    const rows = targetTrend.map((point) => {
      if (window === "previous") {
        return [point.date, String(point.total)];
      }

      return [
        point.date,
        String(point.total),
        String(currentSum),
        previousSum !== null ? String(previousSum) : "",
        changePercent !== null ? `${changePercent}%` : "",
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=lead-trend-${days}d-${labelPrefix}-${timestamp}.csv`,
      },
    });
  } catch {
    return new Response("Unable to export lead trend.", { status: 500 });
  }
}

