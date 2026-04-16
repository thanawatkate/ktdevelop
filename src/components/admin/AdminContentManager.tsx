"use client";

import { useEffect, useState } from "react";
import { AdminInlineContentEditor } from "./AdminInlineContentEditor";

type Entries = Record<string, string>;

interface ContentSection {
  locale: string;
  section: string;
  data: Entries;
}

const LOCALES = ["th", "en"];
const SECTIONS = ["govProposal", "hero", "services", "portfolio", "contact"];

export function AdminContentManager() {
  const [selectedLocale, setSelectedLocale] = useState("th");
  const [selectedSection, setSelectedSection] = useState("govProposal");
  const [content, setContent] = useState<ContentSection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/content?locale=${selectedLocale}&section=${selectedSection}`;
        console.log(`[AdminContentManager] Fetching content from: ${url}`);
        
        const response = await fetch(url);
        const result = await response.json();

        console.log(`[AdminContentManager] Response:`, result);

        if (!response.ok || !result.success) {
          throw new Error(result.error || `Failed to fetch content (status: ${response.status})`);
        }

        setContent({
          locale: selectedLocale,
          section: selectedSection,
          data: result.data || {},
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to fetch content";
        console.error(`[AdminContentManager] Error:`, errMsg);
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [selectedLocale, selectedSection]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-6 text-xl font-bold text-slate-900">Content Manager</h2>

      {/* Locale & Section Selectors */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="locale-select" className="mb-2 block text-sm font-medium text-slate-700">
            Language
          </label>
          <select
            id="locale-select"
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
          >
            {LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {locale === "th" ? "ไทย (Thai)" : "English"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="section-select" className="mb-2 block text-sm font-medium text-slate-700">
            Section
          </label>
          <select
            id="section-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
          >
            {SECTIONS.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6 space-y-2">
        <div className="text-sm text-slate-600">
          Viewing: <span className="font-semibold text-slate-900">{selectedSection}</span> (
          <span className="font-semibold text-slate-900">{selectedLocale}</span>)
        </div>
        {content?.data && (
          <div className="text-sm text-slate-600">
            Total entries: <span className="font-semibold text-slate-900">{Object.keys(content.data).length}</span>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-600">
          Loading content...
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {!isLoading && !error && content?.data && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AdminInlineContentEditor
            locale={selectedLocale}
            section={selectedSection}
            title={selectedSection}
            initialEntries={content.data}
          />
        </div>
      )}
    </section>
  );
}
