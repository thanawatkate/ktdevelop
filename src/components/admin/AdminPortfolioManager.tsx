"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  client_name: string;
  image_url: string | null;
  is_published: number;
  created_at: string;
}

interface PortfolioFormState {
  title: string;
  description: string;
  client_name: string;
  image_url: string;
  is_published: boolean;
}

const initialFormState: PortfolioFormState = {
  title: "",
  description: "",
  client_name: "",
  image_url: "",
  is_published: false,
};

export function AdminPortfolioManager() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [formState, setFormState] = useState<PortfolioFormState>(initialFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submitLabel = useMemo(() => (editingId ? "Update Portfolio" : "Create Portfolio"), [editingId]);

  useEffect(() => {
    void fetchPortfolios();
  }, []);

  async function fetchPortfolios() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/portfolios", { cache: "no-store" });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load portfolios.");
      }

      setItems(result.data as PortfolioItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load portfolios.");
    } finally {
      setIsLoading(false);
    }
  }

  function beginEdit(item: PortfolioItem) {
    setEditingId(item.id);
    setFormState({
      title: item.title,
      description: item.description,
      client_name: item.client_name,
      image_url: item.image_url || "",
      is_published: item.is_published === 1,
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setFormState(initialFormState);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        title: formState.title,
        description: formState.description,
        client_name: formState.client_name,
        image_url: formState.image_url || null,
        is_published: formState.is_published,
      };

      const endpoint = editingId ? `/api/admin/portfolios/${editingId}` : "/api/admin/portfolios";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save portfolio.");
      }

      setMessage(editingId ? "Portfolio updated." : "Portfolio created.");
      resetForm();
      await fetchPortfolios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save portfolio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/portfolios/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete portfolio.");
      }

      setMessage("Portfolio deleted.");
      await fetchPortfolios();

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete portfolio.");
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(null);
    setMessage(null);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Unable to logout.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Portfolio Management</h1>
          <p className="mt-2 text-sm text-slate-600">Create, update, publish, and remove portfolio records.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "Signing out..." : "Logout"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Portfolio" : "Add Portfolio"}</h2>

          <div>
            <label className="block text-sm font-medium text-slate-900" htmlFor="title">
              Project Title
            </label>
            <input
              id="title"
              required
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900" htmlFor="client_name">
              Client Name
            </label>
            <input
              id="client_name"
              required
              value={formState.client_name}
              onChange={(event) => setFormState((prev) => ({ ...prev, client_name: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900" htmlFor="image_url">
              Image URL
            </label>
            <input
              id="image_url"
              value={formState.image_url}
              onChange={(event) => setFormState((prev) => ({ ...prev, image_url: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={5}
              required
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.is_published}
              onChange={(event) => setFormState((prev) => ({ ...prev, is_published: event.target.checked }))}
            />
            Publish immediately
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : submitLabel}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Existing Portfolios</h2>
          {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading portfolios...</p> : null}

          {!isLoading && items.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No portfolio records found.</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{item.client_name}</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.is_published === 1 ? "Published" : "Draft"}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => beginEdit(item)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Edit
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
        </div>
      </div>
    </section>
  );
}