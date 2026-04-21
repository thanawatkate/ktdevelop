"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormTextarea } from "../forms";

type Entries = Record<string, string>;

interface ServiceCard {
  key: string;
  icon: string;
  title: string;
  desc: string;
}

interface Props {
  locale: string;
  initialEntries: Entries;
}

const EMOJI_OPTIONS = [
  "🌐","⚙️","📊","🔒","🚀","💡","🛠️","📱","🎯","🤝","📦","☁️","🔗","🧩","📈","💻","🛡️","⚡","🔍","🌟",
];

function parseCards(entries: Entries): ServiceCard[] {
  const keys = Object.keys(entries)
    .filter((k) => k.endsWith("Title") && k !== "heading")
    .map((k) => k.replace(/Title$/, ""));

  return keys.map((key) => ({
    key,
    icon: entries[`${key}Icon`] || "🌐",
    title: entries[`${key}Title`] || "",
    desc: entries[`${key}Desc`] || "",
  }));
}

function generateNewKey(cards: ServiceCard[]): string {
  const serviceKeys = cards.map((c) => c.key).filter((k) => k.startsWith("service"));
  let n = serviceKeys.length + 1;
  while (cards.some((c) => c.key === `service${n}`)) n++;
  return `service${n}`;
}

export function AdminInlineServicesEditor({ locale, initialEntries }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entries>(initialEntries);
  const [editingCard, setEditingCard] = useState<ServiceCard | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCard, setNewCard] = useState<ServiceCard>({ key: "", icon: "🌐", title: "", desc: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewEmojiPicker, setShowNewEmojiPicker] = useState(false);

  const cards = parseCards(entries);

  async function saveEntries(patch: Entries) {
    const res = await fetch("/api/content", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, section: "services", entries: patch }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Unable to save.");
    return result.data as Entries;
  }

  async function deleteKeys(keys: string[]) {
    const res = await fetch("/api/content/keys", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, section: "services", keys }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Unable to delete.");
  }

  async function handleSaveCard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCard) return;
    setIsSaving(true);
    setError(null);
    try {
      const patch: Entries = {
        [`${editingCard.key}Icon`]: editingCard.icon,
        [`${editingCard.key}Title`]: editingCard.title,
        [`${editingCard.key}Desc`]: editingCard.desc,
      };
      const updated = await saveEntries(patch);
      setEntries(updated);
      setEditingCard(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddCard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newCard.title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const key = generateNewKey(cards);
      const patch: Entries = {
        [`${key}Icon`]: newCard.icon,
        [`${key}Title`]: newCard.title,
        [`${key}Desc`]: newCard.desc,
      };
      const updated = await saveEntries(patch);
      setEntries(updated);
      setNewCard({ key: "", icon: "🌐", title: "", desc: "" });
      setIsAddingNew(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCard(cardKey: string) {
    setIsDeleting(cardKey);
    setError(null);
    try {
      await deleteKeys([`${cardKey}Icon`, `${cardKey}Title`, `${cardKey}Desc`]);
      const next = { ...entries };
      delete next[`${cardKey}Icon`];
      delete next[`${cardKey}Title`];
      delete next[`${cardKey}Desc`];
      setEntries(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <>
      {/* Per-card edit buttons rendered inline — passed via render prop pattern */}
      {error ? (
        <p className="fixed bottom-4 right-4 z-50 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white shadow-lg">
          {error}
        </p>
      ) : null}

      {/* Edit card modal */}
      {editingCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Edit Service Card</h3>
              <button type="button" onClick={() => setEditingCard(null)} className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">Close</button>
            </div>
            <form onSubmit={handleSaveCard} className="space-y-4 p-6">
              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Icon</label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((p) => !p)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-2xl hover:bg-slate-100"
                  >
                    {editingCard.icon}
                  </button>
                  <span className="text-xs text-slate-500">คลิกเพื่อเปลี่ยน icon</span>
                </div>
                {showEmojiPicker ? (
                  <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => { setEditingCard((p) => p ? { ...p, icon: emoji } : p); setShowEmojiPicker(false); }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-indigo-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <FormInput
                id="edit-title"
                label="Title"
                required
                value={editingCard.title}
                onChange={(e) => setEditingCard((p) => p ? { ...p, title: e.target.value } : p)}
              />
              <FormTextarea
                id="edit-desc"
                label="Description"
                rows={3}
                value={editingCard.desc}
                onChange={(e) => setEditingCard((p) => p ? { ...p, desc: e.target.value } : p)}
              />
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteKey(editingCard.key)}
                  disabled={isSaving || isDeleting === editingCard.key}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  {isDeleting === editingCard.key ? "Deleting..." : "Delete Card"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Add new card modal */}
      {isAddingNew ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Add Service Card</h3>
              <button type="button" onClick={() => setIsAddingNew(false)} className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">Close</button>
            </div>
            <form onSubmit={handleAddCard} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Icon</label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewEmojiPicker((p) => !p)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-2xl hover:bg-slate-100"
                  >
                    {newCard.icon}
                  </button>
                  <span className="text-xs text-slate-500">คลิกเพื่อเปลี่ยน icon</span>
                </div>
                {showNewEmojiPicker ? (
                  <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => { setNewCard((p) => ({ ...p, icon: emoji })); setShowNewEmojiPicker(false); }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-indigo-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <FormInput
                id="new-title"
                label="Title"
                required
                value={newCard.title}
                onChange={(e) => setNewCard((p) => ({ ...p, title: e.target.value }))}
              />
              <FormTextarea
                id="new-desc"
                label="Description"
                rows={3}
                value={newCard.desc}
                onChange={(e) => setNewCard((p) => ({ ...p, desc: e.target.value }))}
              />
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Add Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Render cards with edit overlays */}
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="group relative rounded-3xl border border-slate-100 bg-slate-50 p-7 transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            {/* Admin buttons */}
            <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => { setEditingCard(card); setShowEmojiPicker(false); setError(null); }}
                className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteKey(card.key)}
                disabled={isDeleting === card.key}
                className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              >
                {isDeleting === card.key ? "..." : "Delete"}
              </button>
            </div>
            <span className="text-3xl">{card.icon}</span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{card.desc}</p>
          </div>
        ))}
        {/* Add new card button */}
        <button
          type="button"
          onClick={() => { setNewCard({ key: "", icon: "🌐", title: "", desc: "" }); setIsAddingNew(true); setShowNewEmojiPicker(false); setError(null); }}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 bg-white p-7 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600"
        >
          <span className="text-2xl">+</span>
          Add Service
        </button>
      </div>

      {/* Confirm delete card modal */}
      {confirmDeleteKey !== null ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Confirm Deletion</p>
            <h3 className="mt-2 text-base font-semibold text-slate-900">Delete this service card?</h3>
            <p className="mt-1 text-sm text-slate-600">This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteKey(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const key = confirmDeleteKey;
                  setConfirmDeleteKey(null);
                  setEditingCard(null);
                  void handleDeleteCard(key);
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
