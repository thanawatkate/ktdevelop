"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput } from "../forms";

interface ContactStatusAuditItem {
  id: number;
  contact_id: number;
  old_status: "new" | "in_progress" | "closed" | null;
  new_status: "new" | "in_progress" | "closed";
  changed_by: string;
  changed_at: string;
}

const PAGE_SIZE = 10;

export function AdminContactAuditLog() {
  const router = useRouter();
  const [items, setItems] = useState<ContactStatusAuditItem[]>([]);
  const [contactIdFilter, setContactIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAudits();
  }, [page]);

  async function fetchAudits(targetPage = page) {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });

      if (contactIdFilter) {
        params.set("contactId", contactIdFilter);
      }

      const response = await fetch(`/api/admin/contacts/audits?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load audits.");
      }

      setItems(result.data as ContactStatusAuditItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audits.");
    } finally {
      setIsLoading(false);
    }
  }

  function formatStatus(value: "new" | "in_progress" | "closed" | null): string {
    if (!value) {
      return "(none)";
    }
    if (value === "in_progress") {
      return "In Progress";
    }
    if (value === "closed") {
      return "Closed";
    }
    return "New";
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Audit</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Lead Status Change History</h2>
        </div>
        <a
          href={`/api/admin/contacts/audits/export?contactId=${encodeURIComponent(contactIdFilter)}`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      <form
        className="mt-5 flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void fetchAudits(1);
        }}
      >
        <FormInput
          containerClassName="min-w-[220px]"
          value={contactIdFilter}
          onChange={(event) => setContactIdFilter(event.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Filter by Contact ID"
          inputClassName="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setContactIdFilter("");
            setPage(1);
            void fetchAudits(1);
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading audit records...</p> : null}

      {!isLoading && items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No status changes found.</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="py-3 pr-4">Time</th>
              <th className="py-3 pr-4">Contact ID</th>
              <th className="py-3 pr-4">Changed By</th>
              <th className="py-3 pr-4">From</th>
              <th className="py-3 pr-4">To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-4 text-slate-600">{new Date(item.changed_at).toLocaleString()}</td>
                <td className="py-3 pr-4 text-slate-700">{item.contact_id}</td>
                <td className="py-3 pr-4 text-slate-700">{item.changed_by}</td>
                <td className="py-3 pr-4 text-slate-600">{formatStatus(item.old_status)}</td>
                <td className="py-3 pr-4 text-slate-900">{formatStatus(item.new_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1 || isLoading}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">Page {page}</span>
        <button
          type="button"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={isLoading || items.length < PAGE_SIZE}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </section>
  );
}