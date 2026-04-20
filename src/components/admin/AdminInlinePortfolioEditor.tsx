"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormTextarea, FormCheckbox } from "../forms";

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  client_name: string;
  image_url: string | null;
  is_published: number;
}

interface FormState {
  title: string;
  description: string;
  client_name: string;
  image_url: string;
  is_published: boolean;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  client_name: "",
  image_url: "",
  is_published: true,
};

interface Props {
  portfolios: PortfolioItem[];
}

export function AdminInlinePortfolioEditor({ portfolios: initialPortfolios }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(initialPortfolios);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchPortfolios() {
    try {
      const res = await fetch("/api/admin/portfolios", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setPortfolios(data.data as PortfolioItem[]);
    } catch {
      // ignore
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setMessage(null);
    setIsOpen(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      client_name: item.client_name,
      image_url: item.image_url || "",
      is_published: item.is_published === 1,
    });
    setError(null);
    setMessage(null);
    setIsOpen(true);
  }

  function close() {
    if (!isSaving) setIsOpen(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = editingId ? `/api/admin/portfolios/${editingId}` : "/api/admin/portfolios";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          client_name: form.client_name,
          image_url: form.image_url || null,
          is_published: form.is_published,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Unable to save portfolio.");

      setMessage(editingId ? "Portfolio updated." : "Portfolio created.");
      await fetchPortfolios();
      router.refresh();

      if (!editingId) {
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save portfolio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/portfolios/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Unable to delete portfolio.");

      setMessage("Portfolio deleted.");
      await fetchPortfolios();
      router.refresh();

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete portfolio.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openAdd}
        className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
      >
        + Add Portfolio
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex h-screen max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Portfolio" : "Add Portfolio"}
              </h3>
              <button
                type="button"
                onClick={close}
                className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Form */}
              <form onSubmit={handleSubmit} className="flex w-1/2 flex-col border-r border-slate-200">
                <div className="flex-1 space-y-4 overflow-auto p-6">
                  <FormInput
                    id="p-title"
                    label="Project Title"
                    required
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                  <FormInput
                    id="p-client"
                    label="Client Name"
                    required
                    value={form.client_name}
                    onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
                  />
                  <FormInput
                    id="p-image"
                    label="Image URL"
                    placeholder="https://..."
                    value={form.image_url}
                    onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  />
                  <FormTextarea
                    id="p-desc"
                    label="Description"
                    rows={4}
                    required
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  <FormCheckbox
                    label="Publish immediately"
                    checked={form.is_published}
                    onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                    labelClassName="flex items-center gap-2 text-sm text-slate-700"
                  />
                  {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                  {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
                </div>
                <div className="flex flex-shrink-0 gap-2 border-t border-slate-200 p-4">
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setForm(emptyForm); setMessage(null); }}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + New
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
                  </button>
                </div>
              </form>

              {/* Portfolio list */}
              <div className="flex w-1/2 flex-col">
                <p className="flex-shrink-0 border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                  Existing ({portfolios.length})
                </p>
                <div className="flex-1 space-y-2 overflow-auto p-4">
                  {portfolios.length === 0 ? (
                    <p className="text-sm text-slate-500">No portfolios yet.</p>
                  ) : null}
                  {portfolios.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 ${editingId === item.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-indigo-600">{item.client_name}</p>
                          <p className="mt-0.5 truncate text-sm font-medium text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.is_published === 1 ? "Published" : "Draft"}</p>
                        </div>
                        <div className="flex flex-shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            {deletingId === item.id ? "..." : "Del"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
