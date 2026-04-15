import { ContactRepository } from "../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

function parseStatus(value: string): "all" | "new" | "in_progress" | "closed" {
  if (value === "new" || value === "in_progress" || value === "closed") {
    return value;
  }

  return "all";
}

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const fromDate = searchParams.get("from") || "";
    const toDate = searchParams.get("to") || "";
    const status = parseStatus(searchParams.get("status") || "all");

    const contacts = await contactRepository.getAllWithFilters({
      search,
      fromDate,
      toDate,
      status,
      limit: 1000,
      offset: 0,
    });

    const header = [
      "id",
      "sender_name",
      "email",
      "subject",
      "message",
      "file_url",
      "created_at",
    ];

    const rows = contacts.map((contact) => [
      String(contact.id),
      contact.sender_name,
      contact.email,
      contact.subject,
      contact.message,
      contact.file_url || "",
      new Date(contact.created_at).toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=contacts-${timestamp}.csv`,
      },
    });
  } catch {
    return new Response("Unable to export contacts.", { status: 500 });
  }
}