"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Entries = Record<string, string>;

interface AdminInlineContentEditorProps {
  locale: string;
  section: string;
  title: string;
  initialEntries: Entries;
  sourceSectionLocale?: string;
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
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<{done: number; total: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entries>(initialEntries);

  const entryKeys = useMemo(() => Object.keys(entries), [entries]);

  async function handleTranslateFromThai() {
    setIsTranslating(true);
    setError(null);

    try {
      // Fetch current Thai content for this section
      const thResponse = await fetch(`/api/content?locale=th&section=${section}`);
      const thResult = await thResponse.json();
      if (!thResult.success) throw new Error("Failed to load Thai source content");

      const thaiEntries: Entries = thResult.data || {};
      const keys = Object.keys(thaiEntries);
      setTranslateProgress({ done: 0, total: keys.length });

      const translated: Entries = { ...entries };
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const text = thaiEntries[key];
        if (!text) continue;

        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sourceLanguage: "th", targetLanguage: "en" }),
        });
        const r = await res.json();
        if (r.success) {
          translated[key] = r.translated;
        }
        setTranslateProgress({ done: i + 1, total: keys.length });
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setEntries(translated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setIsTranslating(false);
      setTranslateProgress(null);
    }
  }

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
        credentials: "include",
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
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Edit {title} ({locale})</h3>
                {locale === "en" && (
                  <button
                    type="button"
                    onClick={handleTranslateFromThai}
                    disabled={isTranslating || isSaving}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                        {translateProgress
                          ? `${translateProgress.done}/${translateProgress.total}`
                          : "Translating..."}
                      </>
                    ) : (
                      <>🤖 แปลจากภาษาไทย</>
                    )}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={closeEditor}
                disabled={isTranslating}
                className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
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
                  disabled={isSaving || isTranslating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  disabled={isSaving || isTranslating}
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
