"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput } from "../forms";

type Entries = Record<string, string>;

interface Props {
  locale: string;
  initialEntries: Entries;
}

function parseItems(entries: Entries): { key: string; value: string }[] {
  return Object.keys(entries)
    .filter((k) => /^why\d+$/.test(k))
    .sort((a, b) => {
      const na = parseInt(a.replace("why", ""), 10);
      const nb = parseInt(b.replace("why", ""), 10);
      return na - nb;
    })
    .map((key) => ({ key, value: entries[key] }));
}

function generateNextKey(entries: Entries): string {
  let n = 1;
  while (entries[`why${n}`] !== undefined) n++;
  return `why${n}`;
}

export function AdminInlineWhyUsEditor({ locale, initialEntries }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<Entries>(initialEntries);
  const [newItem, setNewItem] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const items = parseItems(entries);

  async function patchEntries(patch: Entries) {
    const res = await fetch("/api/content", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, section: "contact", entries: patch }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Unable to save.");
    return result.data as Entries;
  }

  async function deleteKey(key: string) {
    const res = await fetch("/api/content/keys", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, section: "contact", keys: [key] }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Unable to delete.");
  }

  async function handleSaveItem(key: string, value: string) {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await patchEntries({ [key]: value });
      setEntries(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newItem.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const key = generateNextKey(entries);
      const updated = await patchEntries({ [key]: newItem.trim() });
      setEntries(updated);
      setNewItem("");
      setMessage("Added!");
      setTimeout(() => setMessage(null), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem(key: string) {
    setDeletingKey(key);
    setError(null);
    try {
      await deleteKey(key);
      const next = { ...entries };
      delete next[key];
      setEntries(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setIsOpen(true); setError(null); setMessage(null); }}
        className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
      >
        Edit Why Us
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Edit Why Us</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {/* List */}
            <div className="flex-1 space-y-2 overflow-auto p-6">
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">No items yet.</p>
              ) : null}
              {items.map((item) => (
                <ItemRow
                  key={item.key}
                  itemKey={item.key}
                  value={item.value}
                  isDeleting={deletingKey === item.key}
                  isSaving={isSaving}
                  onSave={handleSaveItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>

            {/* Add new */}
            <div className="flex-shrink-0 border-t border-slate-200 p-6">
              <p className="mb-3 text-sm font-medium text-slate-700">Add new item</p>
              <form onSubmit={handleAddItem} className="flex gap-2">
                <FormInput
                  id="new-why"
                  placeholder="เพิ่มข้อความ..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  containerClassName="flex-1"
                />
                <button
                  type="submit"
                  disabled={isSaving || !newItem.trim()}
                  className="flex-shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "..." : "Add"}
                </button>
              </form>
              {message ? <p className="mt-2 text-sm text-emerald-600">{message}</p> : null}
              {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ── Inline editable row ── */
function ItemRow({
  itemKey,
  value,
  isDeleting,
  isSaving,
  onSave,
  onDelete,
}: {
  itemKey: string;
  value: string;
  isDeleting: boolean;
  isSaving: boolean;
  onSave: (key: string, value: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  async function handleSave() {
    if (!draft.trim() || draft === value) { setEditing(false); return; }
    await onSave(itemKey, draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 p-3">
        <input
          autoFocus
          title="Edit item"
          placeholder="แก้ไขข้อความ..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); if (e.key === "Escape") setEditing(false); }}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => { setDraft(value); setEditing(false); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-start gap-2 text-sm text-slate-700">
        <span className="mt-0.5 text-indigo-500">✓</span>
        <span>{value}</span>
      </div>
      <div className="flex flex-shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={() => { setDraft(value); setEditing(true); }}
          className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => void onDelete(itemKey)}
          disabled={isDeleting}
          className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
        >
          {isDeleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
