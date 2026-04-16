"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface QuoteSyncRow {
  id: number;
  quote_id: number;
  quote_number: string;
  status: "pending" | "synced" | "failed";
  attempt_count: number;
  last_error: string | null;
  last_attempt_at: string | null;
  next_retry_at: string;
  created_at: string;
  updated_at: string;
}

interface ProcessResult {
  scanned: number;
  synced: number;
  failed: number;
  skipped: number;
}

type StatusFilter = "all" | "pending" | "synced" | "failed";

const PAGE_SIZE = 20;

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: QuoteSyncRow["status"]): string {
  if (status === "synced") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "failed") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-800";
}

function canRetry(status: QuoteSyncRow["status"]): boolean {
  return status === "pending" || status === "failed";
}

export function AdminQuoteSyncManager() {
  const router = useRouter();
  const [rows, setRows] = useState<QuoteSyncRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryingQuoteId, setRetryingQuoteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // filter + pagination state
  const [quoteSearch, setQuoteSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetchStatus();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [quoteSearch, statusFilter]);

  const summary = useMemo(() => {
    const data = { pending: 0, failed: 0, synced: 0 };

    for (const row of rows) {
      if (row.status === "pending") {
        data.pending += 1;
      } else if (row.status === "failed") {
        data.failed += 1;
      } else if (row.status === "synced") {
        data.synced += 1;
      }
    }

    return data;
  }, [rows]);

  // Client-side filtering
  const filteredRows = useMemo(() => {
    const searchTerm = quoteSearch.trim().toLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (searchTerm && !row.quote_number.toLowerCase().includes(searchTerm)) {
        return false;
      }

      return true;
    });
  }, [rows, quoteSearch, statusFilter]);

  // Pagination derived state
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function fetchStatus() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/quotes/sync?limit=500", { cache: "no-store" });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to fetch quote sync status.");
      }

      setRows((result.data || []) as QuoteSyncRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch quote sync status.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProcessPending() {
    setIsProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/quotes/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 50 }),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to process pending queue.");
      }

      const data = (result.data || {}) as ProcessResult;
      setMessage(
        `Processed queue: scanned ${data.scanned || 0}, synced ${data.synced || 0}, failed ${data.failed || 0}, skipped ${data.skipped || 0}.`
      );
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process pending queue.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRetryQuote(quoteId: number) {
    setRetryingQuoteId(quoteId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/integrations/pos/quotes/${quoteId}`, {
        method: "POST",
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to retry quote sync.");
      }

      setMessage(`Retry completed for quote #${quoteId}.`);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retry quote sync.");
    } finally {
      setRetryingQuoteId(null);
    }
  }

  const isBusy = isLoading || isProcessing || retryingQuoteId !== null;

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Quote Integrations</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">POS Sync Queue</h2>
          <p className="mt-1 text-sm text-slate-600">Monitor sync status and retry specific quote push requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchStatus()}
            disabled={isBusy}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => void handleProcessPending()}
            disabled={isBusy}
            className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isProcessing ? "Processing..." : "Process Pending"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          className={`rounded-2xl border px-4 py-3 text-left transition hover:opacity-90 ${statusFilter === "pending" ? "ring-2 ring-amber-400" : ""} border-amber-200 bg-amber-50`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-amber-900">{summary.pending}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "failed" ? "all" : "failed")}
          className={`rounded-2xl border px-4 py-3 text-left transition hover:opacity-90 ${statusFilter === "failed" ? "ring-2 ring-rose-400" : ""} border-rose-200 bg-rose-50`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-rose-900">{summary.failed}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "synced" ? "all" : "synced")}
          className={`rounded-2xl border px-4 py-3 text-left transition hover:opacity-90 ${statusFilter === "synced" ? "ring-2 ring-emerald-400" : ""} border-emerald-200 bg-emerald-50`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Synced</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">{summary.synced}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search quote number..."
          value={quoteSearch}
          onChange={(e) => setQuoteSearch(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="synced">Synced</option>
        </select>
        {(quoteSearch || statusFilter !== "all") ? (
          <button
            type="button"
            onClick={() => { setQuoteSearch(""); setStatusFilter("all"); }}
            className="text-xs text-slate-500 underline transition hover:text-slate-700"
          >
            Clear filters
          </button>
        ) : null}
        <span className="ml-auto text-xs text-slate-500">
          {filteredRows.length} record{filteredRows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Quote</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Attempts</th>
              <th className="px-3 py-2 text-left font-semibold">Last Attempt</th>
              <th className="px-3 py-2 text-left font-semibold">Next Retry</th>
              <th className="px-3 py-2 text-left font-semibold">Error</th>
              <th className="px-3 py-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {pagedRows.length === 0 && !isLoading ? (
              <tr>
                <td className="px-3 py-5 text-center text-slate-500" colSpan={7}>
                  {filteredRows.length === 0 && rows.length > 0 ? "No records match your filter." : "No sync records yet."}
                </td>
              </tr>
            ) : null}

            {pagedRows.map((row) => {
              const isRetrying = retryingQuoteId === row.quote_id;
              const retryable = canRetry(row.status);

              return (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{row.quote_number}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClasses(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.attempt_count}</td>
                  <td className="px-3 py-2">{formatDate(row.last_attempt_at)}</td>
                  <td className="px-3 py-2">{formatDate(row.next_retry_at)}</td>
                  <td className="max-w-[20rem] px-3 py-2 text-xs text-slate-500">{row.last_error || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {retryable ? (
                      <button
                        type="button"
                        onClick={() => void handleRetryQuote(row.quote_id)}
                        disabled={isBusy}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRetrying ? "Retrying..." : "Retry now"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
