"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, ChangeEvent } from "react";
import { FormInput, FormTextarea, FormCheckbox } from "../forms";

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  client_name: string;
  image_url: string | null;
  is_published: number;
}

interface Props {
  portfolios: PortfolioItem[];
}

interface EditForm {
  title: string;
  description: string;
  client_name: string;
  image_url: string;
  is_published: boolean;
}

export function AdminPortfolioGrid({ portfolios: initialPortfolios }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(initialPortfolios);
  const [editingItem, setEditingItem] = useState<(PortfolioItem & { form: EditForm }) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchPortfolios() {
    try {
      const res = await fetch("/api/admin/portfolios", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setPortfolios(data.data as PortfolioItem[]);
    } catch { /* ignore */ }
  }

  function openEdit(item: PortfolioItem) {
    setEditingItem({
      ...item,
      form: {
        title: item.title,
        description: item.description,
        client_name: item.client_name,
        image_url: item.image_url || "",
        is_published: item.is_published === 1,
      },
    });
    setError(null);
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    setIsUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Upload failed.");
      setEditingItem((p) => p ? { ...p, form: { ...p.form, image_url: result.url as string } } : p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!editingItem) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolios/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingItem.form.title,
          description: editingItem.form.description,
          client_name: editingItem.form.client_name,
          image_url: editingItem.form.image_url || null,
          is_published: editingItem.form.is_published,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Unable to save.");
      setEditingItem(null);
      await fetchPortfolios();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolios/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Unable to delete.");
      setConfirmDeleteId(null);
      if (editingItem?.id === id) setEditingItem(null);
      await fetchPortfolios();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!portfolios.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Portfolio</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">No published projects yet</h2>
        <p className="mt-3 text-base text-slate-600">Projects will appear here once they are published from the admin workflow.</p>
      </section>
    );
  }

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {portfolios.map((portfolio) => (
          <article
            key={portfolio.id}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Admin action buttons */}
            <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => openEdit(portfolio)}
                className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(portfolio.id)}
                className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
              >
                Delete
              </button>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              {portfolio.image_url ? (
                <img
                  src={portfolio.image_url}
                  alt={portfolio.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-sm font-medium text-slate-500">
                  Project Preview
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">{portfolio.client_name}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{portfolio.title}</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-7 text-slate-600">{portfolio.description}</p>
              <p className="mt-2 text-xs text-slate-400">{portfolio.is_published === 1 ? "Published" : "Draft"}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Edit modal */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Edit Portfolio</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Close
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-auto p-6">
              <FormInput
                id="e-title"
                label="Project Title"
                required
                value={editingItem.form.title}
                onChange={(e) => setEditingItem((p) => p ? { ...p, form: { ...p.form, title: e.target.value } } : p)}
              />
              <FormInput
                id="e-client"
                label="Client Name"
                required
                value={editingItem.form.client_name}
                onChange={(e) => setEditingItem((p) => p ? { ...p, form: { ...p.form, client_name: e.target.value } } : p)}
              />
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-slate-900">Image</label>
                {editingItem.form.image_url ? (
                  <div className="relative mt-2">
                    <img src={editingItem.form.image_url} alt="preview" className="h-36 w-full rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditingItem((p) => p ? { ...p, form: { ...p.form, image_url: "" } } : p)}
                      className="absolute right-2 top-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-xs font-semibold text-white hover:bg-slate-900/80"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <label
                    htmlFor="e-file-upload"
                    className={`cursor-pointer rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 ${isUploading ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {isUploading ? "Uploading..." : "📁 Choose File"}
                  </label>
                  <input
                    ref={fileInputRef}
                    id="e-file-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                  />
                  <span className="text-xs text-slate-500">JPG, PNG, WebP · Max 5MB</span>
                </div>
                <div className="mt-3">
                  <FormInput
                    id="e-image-url"
                    label="หรือวาง URL"
                    placeholder="https://..."
                    value={editingItem.form.image_url}
                    onChange={(e) => setEditingItem((p) => p ? { ...p, form: { ...p.form, image_url: e.target.value } } : p)}
                    labelClassName="block text-xs font-medium text-slate-500"
                  />
                </div>
              </div>
              <FormTextarea
                id="e-desc"
                label="Description"
                rows={4}
                value={editingItem.form.description}
                onChange={(e) => setEditingItem((p) => p ? { ...p, form: { ...p.form, description: e.target.value } } : p)}
              />
              <FormCheckbox
                label="Published"
                checked={editingItem.form.is_published}
                onChange={(e) => setEditingItem((p) => p ? { ...p, form: { ...p.form, is_published: e.target.checked } } : p)}
                labelClassName="flex items-center gap-2 text-sm text-slate-700"
              />
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            </div>
            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm delete modal */}
      {confirmDeleteId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Confirm Deletion</p>
            <h3 className="mt-2 text-base font-semibold text-slate-900">Delete this portfolio?</h3>
            <p className="mt-1 text-sm text-slate-600">This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
