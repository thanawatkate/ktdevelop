"use client";

import { useState } from "react";
import { AdminContentManager } from "./AdminContentManager";
import { AdminPortfolioManager } from "./AdminPortfolioManager";
import { AdminContactAuditLog } from "./AdminContactAuditLog";

type SettingsTab = "content" | "portfolios" | "audits";

const TABS: { id: SettingsTab; label: string; description: string }[] = [
  { id: "content", label: "Content", description: "Edit website copy by language and section." },
  { id: "portfolios", label: "Portfolios", description: "Create, update, publish, and remove portfolio records." },
  { id: "audits", label: "Audits", description: "History of lead status changes." },
];

export function AdminSettingsPanel() {
  const [tab, setTab] = useState<SettingsTab>("content");
  const active = TABS.find((item) => item.id === tab) ?? TABS[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">{active.description}</p>
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((item) => {
          const isActive = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "content" ? <AdminContentManager /> : null}
      {tab === "portfolios" ? <AdminPortfolioManager /> : null}
      {tab === "audits" ? <AdminContactAuditLog /> : null}
    </div>
  );
}
