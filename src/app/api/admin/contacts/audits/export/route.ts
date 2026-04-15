import { ContactRepository } from "../../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function formatStatus(value: "new" | "in_progress" | "closed" | null): string {
  if (!value) {
    return "(none)";
  }
  if (value === "in_progress") {
    return "in_progress";
  }
  if (value === "closed") {
    return "closed";
  }
  return "new";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = Number(searchParams.get("contactId") || "0");

    const audits = await contactRepository.getStatusAudits({
      limit: 5000,
      offset: 0,
      contactId,
    });

    const header = ["id", "contact_id", "old_status", "new_status", "changed_by", "changed_at"];
    const rows = audits.map((audit) => [
      String(audit.id),
      String(audit.contact_id),
      formatStatus(audit.old_status),
      formatStatus(audit.new_status),
      audit.changed_by,
      new Date(audit.changed_at).toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=contact-status-audits-${timestamp}.csv`,
      },
    });
  } catch {
    return new Response("Unable to export contact status audits.", { status: 500 });
  }
}