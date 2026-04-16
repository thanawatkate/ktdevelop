"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormSelect } from "../forms";

interface ContactItem {
  id: number;
  sender_name: string;
  email: string;
  subject: string;
  message: string;
  file_url: string | null;
  status: "new" | "in_progress" | "closed";
  created_at: string;
}

interface ContactMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ContactKpi {
  total: number;
  newCount: number;
  inProgressCount: number;
  closedCount: number;
  overdueNewCount: number;
}

interface ContactTrendPoint {
  date: string;
  total: number;
}

interface TrendComparison {
  currentTotal: number;
  previousTotal: number;
  changePercent: number | null;
}

type ChangeDisplayMode = "percent" | "absolute";

const PAGE_SIZE = 10;
const SLA_DAYS = Number(process.env.NEXT_PUBLIC_LEAD_SLA_DAYS || "3") > 0
  ? Number(process.env.NEXT_PUBLIC_LEAD_SLA_DAYS || "3")
  : 3;
const BAR_HEIGHT_CLASSES = [
  "h-[6%]",
  "h-[12%]",
  "h-[18%]",
  "h-[24%]",
  "h-[30%]",
  "h-[36%]",
  "h-[42%]",
  "h-[48%]",
  "h-[54%]",
  "h-[60%]",
  "h-[66%]",
  "h-[72%]",
  "h-[78%]",
  "h-[84%]",
  "h-[90%]",
  "h-[96%]",
] as const;
const AVG_LINE_TOP_CLASSES = [
  "top-[94%]",
  "top-[88%]",
  "top-[82%]",
  "top-[76%]",
  "top-[70%]",
  "top-[64%]",
  "top-[58%]",
  "top-[52%]",
  "top-[46%]",
  "top-[40%]",
  "top-[34%]",
  "top-[28%]",
  "top-[22%]",
  "top-[16%]",
  "top-[10%]",
  "top-[4%]",
] as const;

export function AdminContactManager() {
  const router = useRouter();
  const [items, setItems] = useState<ContactItem[]>([]);
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "closed">("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [meta, setMeta] = useState<ContactMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [kpi, setKpi] = useState<ContactKpi>({
    total: 0,
    newCount: 0,
    inProgressCount: 0,
    closedCount: 0,
    overdueNewCount: 0,
  });
  const [trendWindow, setTrendWindow] = useState<7 | 30>(7);
  const [trend, setTrend] = useState<ContactTrendPoint[]>([]);
  const [trendComparison, setTrendComparison] = useState<TrendComparison | null>(null);
  const [changeDisplayMode, setChangeDisplayMode] = useState<ChangeDisplayMode>("percent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);

  useEffect(() => {
    void fetchContacts();
  }, [page, fromDate, toDate, statusFilter]);

  useEffect(() => {
    void fetchKpi();
  }, []);

  useEffect(() => {
    void fetchTrend(trendWindow);
  }, [trendWindow]);

  async function fetchKpi() {
    try {
      const response = await fetch("/api/admin/contacts/kpi", { cache: "no-store" });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (response.ok && result.success) {
        setKpi(result.data as ContactKpi);
      }
    } catch {
      setKpi((prev) => prev);
    }
  }

  async function fetchTrend(days: 7 | 30) {
    try {
      const response = await fetch(`/api/admin/contacts/trend?days=${days}`, { cache: "no-store" });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (response.ok && result.success) {
        setTrend(result.data as ContactTrendPoint[]);
        setTrendComparison((result.meta?.comparison || null) as TrendComparison | null);
      }
    } catch {
      setTrend((prev) => prev);
      setTrendComparison((prev) => prev);
    }
  }

  async function fetchContacts(search = query, targetPage = page) {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: search,
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });

      if (fromDate) {
        params.set("from", fromDate);
      }

      if (toDate) {
        params.set("to", toDate);
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/contacts?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load contacts.");
      }

      setItems(result.data as ContactItem[]);
      setMeta(result.meta as ContactMeta);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contacts.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await fetchContacts(query, 1);
  }

  async function handleDelete(id: number) {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete contact.");
      }

      setMessage("Contact submission deleted.");
      await fetchContacts();
      await fetchKpi();
      await fetchTrend(trendWindow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete contact.");
    }
  }

  async function handleStatusUpdate(id: number, status: "new" | "in_progress" | "closed") {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update contact status.");
      }

      setMessage("Lead status updated.");
      await fetchContacts();
      await fetchKpi();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update contact status.");
    }
  }

  function getStatusPillClass(status: "new" | "in_progress" | "closed") {
    if (status === "new") {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    if (status === "in_progress") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  function getLeadAgeDays(createdAt: string): number {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - created);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/contacts/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete selected contacts.");
      }

      setMessage(`Deleted ${result.deletedCount} contact(s).`);
      setIsConfirmingBulkDelete(false);
      await fetchContacts();
      await fetchKpi();
      await fetchTrend(trendWindow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete selected contacts.");
    }
  }

  function toggleSelection(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    const currentIds = items.map((item) => item.id);
    const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : currentIds);
  }

  function getBarHeightClass(value: number, maxValue: number): string {
    const ratio = maxValue > 0 ? value / maxValue : 0;
    const index = Math.max(0, Math.min(BAR_HEIGHT_CLASSES.length - 1, Math.round(ratio * (BAR_HEIGHT_CLASSES.length - 1))));
    return BAR_HEIGHT_CLASSES[index];
  }

  function formatDateLabel(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }

  function getAverageLineTopClass(average: number, maxValue: number): string {
    const ratio = maxValue > 0 ? average / maxValue : 0;
    const index = Math.max(0, Math.min(AVG_LINE_TOP_CLASSES.length - 1, Math.round(ratio * (AVG_LINE_TOP_CLASSES.length - 1))));
    return AVG_LINE_TOP_CLASSES[index];
  }

  function renderTrendChange(): string {
    if (!trendComparison) {
      return "n/a";
    }

    const absoluteChange = trendComparison.currentTotal - trendComparison.previousTotal;
    if (changeDisplayMode === "absolute") {
      return `${absoluteChange >= 0 ? "+" : ""}${absoluteChange} leads`;
    }

    if (trendComparison.changePercent === null) {
      return "n/a";
    }

    return `${trendComparison.changePercent >= 0 ? "+" : ""}${trendComparison.changePercent.toFixed(1)}%`;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Inbound Leads</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Contact Submissions</h2>
        </div>
        <a
          href={`/api/admin/contacts/export?q=${encodeURIComponent(query)}&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&status=${encodeURIComponent(statusFilter)}`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      <form className="mt-5 flex flex-wrap gap-3" onSubmit={handleSearch}>
        <FormInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by sender, email, subject, message"
          containerClassName="min-w-[280px] flex-1"
          inputClassName="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
        <FormInput
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          inputClassName="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
          containerClassName="flex-none"
        />
        <FormInput
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          inputClassName="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
          containerClassName="flex-none"
        />
        <button
          type="button"
          onClick={() => {
            setFromDate("");
            setToDate("");
            setQuery("");
            setPage(1);
            void fetchContacts("", 1);
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear
        </button>
        <FormSelect
          id="statusFilter"
          value={statusFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as "all" | "new" | "in_progress" | "closed")}
          selectClassName="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
          containerClassName="flex-none"
          options={[
            { value: "all", label: "All status" },
            { value: "new", label: "New" },
            { value: "in_progress", label: "In Progress" },
            { value: "closed", label: "Closed" },
          ]}
        />
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Leads</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{kpi.total}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">New</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-700">{kpi.newCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-600">In Progress</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{kpi.inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Closed</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{kpi.closedCount}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-600">Overdue New</p>
          <p className="mt-2 text-2xl font-semibold text-rose-700">{kpi.overdueNewCount}</p>
          <p className="mt-1 text-xs text-rose-700/80">SLA at least {SLA_DAYS} day(s)</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lead Trend</p>
            <p className="mt-1 text-sm font-medium text-slate-800">Daily created leads over selected period</p>
            {trendComparison ? (
              <p className="mt-1 text-xs text-slate-600">
                Current: <span className="font-semibold text-slate-800">{trendComparison.currentTotal}</span> | Previous: <span className="font-semibold text-slate-800">{trendComparison.previousTotal}</span> | Change:{" "}
                <span
                  className={
                    trendComparison.changePercent === null
                      ? "font-semibold text-slate-700"
                      : trendComparison.changePercent >= 0
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-rose-700"
                  }
                >
                  {renderTrendChange()}
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/admin/contacts/trend/export?days=${trendWindow}&window=current`}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              Export Current CSV
            </a>
            <a
              href={`/api/admin/contacts/trend/export?days=${trendWindow}&window=previous`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Export Previous CSV
            </a>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTrendWindow(7)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  trendWindow === 7 ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                7 days
              </button>
              <button
                type="button"
                onClick={() => setTrendWindow(30)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  trendWindow === 30 ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                30 days
              </button>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setChangeDisplayMode("percent")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  changeDisplayMode === "percent"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                % Change
              </button>
              <button
                type="button"
                onClick={() => setChangeDisplayMode("absolute")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  changeDisplayMode === "absolute"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Absolute
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {trend.length === 0 ? (
            <p className="text-sm text-slate-500">No trend data available.</p>
          ) : (
            (() => {
              const maxValue = Math.max(1, ...trend.map((item) => item.total));
              const average = trend.reduce((sum, item) => sum + item.total, 0) / Math.max(1, trend.length);

              return (
                <div className="relative flex h-36 items-end gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  {/* grid lines at 25%, 50%, 75% */}
                  <div className="pointer-events-none absolute inset-x-3 top-[25%] border-t border-slate-200/80" />
                  <div className="pointer-events-none absolute inset-x-3 top-[50%] border-t border-slate-200/80" />
                  <div className="pointer-events-none absolute inset-x-3 top-[75%] border-t border-slate-200/80" />
                  <div className={`pointer-events-none absolute inset-x-3 border-t border-dashed border-amber-400/90 ${getAverageLineTopClass(average, maxValue)}`} />
                  {trend.map((point) => (
                    <div key={point.date} className="group relative flex min-w-0 flex-1 items-end justify-center">
                      <div className={`w-full rounded-t bg-indigo-500/85 transition group-hover:bg-indigo-600 ${getBarHeightClass(point.total, maxValue)}`} />
                      <div className="pointer-events-none absolute -top-9 rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                        {formatDateLabel(point.date)}: {point.total}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{trend[0]?.date ? formatDateLabel(trend[0].date) : "-"}</span>
            <span>{trend[trend.length - 1]?.date ? formatDateLabel(trend[trend.length - 1].date) : "-"}</span>
          </div>
          {trend.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-indigo-500" />
                Daily leads (bars)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-[1px] w-4 border-t border-dashed border-amber-500" />
                Average line ({trendWindow} days)
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={items.length > 0 && items.every((item) => selectedIds.includes(item.id))}
            onChange={toggleSelectAll}
          />
          Select all on page
        </label>

        <button
          type="button"
          onClick={() => setIsConfirmingBulkDelete(true)}
          disabled={selectedIds.length === 0 || isLoading}
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete Selected ({selectedIds.length})
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading contacts...</p> : null}

      {!isLoading && items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No contacts found for this filter.</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <label className="mb-2 inline-flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelection(item.id)}
                  />
                  Select
                </label>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                  <span>•</span>
                  <span>{item.email}</span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-slate-900">{item.subject}</h3>
                <p className="mt-1 text-sm text-slate-700">From: {item.sender_name}</p>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusPillClass(item.status)}`}>
                  {item.status === "in_progress" ? "In Progress" : item.status === "closed" ? "Closed" : "New"}
                </span>
                {item.status === "new" && getLeadAgeDays(item.created_at) >= SLA_DAYS ? (
                  <span className="ml-2 mt-2 inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                    SLA Alert: {getLeadAgeDays(item.created_at)}d
                  </span>
                ) : null}
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.message}</p>
                {item.file_url ? (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View attached file
                  </a>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <select
                  value={item.status}
                  onChange={(event) =>
                    void handleStatusUpdate(item.id, event.target.value as "new" | "in_progress" | "closed")
                  }
                  title="Lead status"
                  aria-label="Lead status"
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-600"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedContact(item)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  View Detail
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
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
          disabled={isLoading || page >= meta.totalPages}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>

      <p className="mt-2 text-right text-xs text-slate-500">
        Total {meta.total} submissions • {meta.totalPages} page(s)
      </p>

      {isConfirmingBulkDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Confirm Deletion</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Delete selected contacts?</h3>
            <p className="mt-2 text-sm text-slate-600">
              You are about to permanently delete {selectedIds.length} contact submission(s). This action cannot be
              undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingBulkDelete(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedContact ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Submission Detail</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedContact.subject}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedContact.sender_name} • {selectedContact.email}
                </p>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusPillClass(selectedContact.status)}`}>
                  {selectedContact.status === "in_progress"
                    ? "In Progress"
                    : selectedContact.status === "closed"
                      ? "Closed"
                      : "New"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {selectedContact.message}
            </div>

            {selectedContact.file_url ? (
              <a
                href={selectedContact.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Open attached file
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}