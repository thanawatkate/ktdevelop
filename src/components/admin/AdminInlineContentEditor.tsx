"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Entries = Record<string, string>;

interface AdminInlineContentEditorProps {
  locale: string;
  section: string;
  title: string;
  initialEntries: Entries;
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function AdminInlineContentEditor({
  locale,
  section,
  title,
  initialEntries,
}: AdminInlineContentEditorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entries>(initialEntries);

  const entryKeys = useMemo(() => Object.keys(entries), [entries]);

  function openEditor() {
    setEntries(initialEntries);
    setError(null);
    setIsOpen(true);
  }

  function closeEditor() {
    if (!isSaving) {
      setIsOpen(false);
    }
  }

  function onChange(key: string, value: string) {
    setEntries((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/content", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          section,
          entries,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update content.");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update content.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
      >
        Edit {title}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit {title} ({locale})</h3>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                {entryKeys.map((key) => (
                  <div key={key}>
                    <label htmlFor={`${section}-${key}`} className="mb-1 block text-sm font-medium text-slate-700">
                      {toLabel(key)}
                    </label>
                    <textarea
                      id={`${section}-${key}`}
                      value={entries[key] ?? ""}
                      onChange={(event) => onChange(key, event.target.value)}
                      rows={key.toLowerCase().includes("description") ? 4 : 2}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
