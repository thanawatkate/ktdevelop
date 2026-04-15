"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function SiteHeader() {
  const t = useTranslations("navigation");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          KT Develop
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {t("home")}
          </Link>
          <Link
            href="/portfolio"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {t("portfolio")}
          </Link>
          <Link
            href="/contact"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {t("contact")}
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 hover:text-indigo-900"
          >
            {t("admin")}
          </Link>
        </nav>
      </div>
    </header>
  );
}