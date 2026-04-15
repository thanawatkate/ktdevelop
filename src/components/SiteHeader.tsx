"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const navLinks = [
  { href: "#home", labelKey: "home" },
  { href: "#services", labelKey: "services" },
  { href: "#portfolio", labelKey: "portfolio" },
  { href: "#contact", labelKey: "contact" },
] as const;

export function SiteHeader() {
  const t = useTranslations("navigation");

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a
          href="#home"
          onClick={(e) => handleAnchorClick(e, "#home")}
          className="text-lg font-bold tracking-tight text-white"
        >
          KT Develop
        </a>
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, labelKey }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleAnchorClick(e, href)}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {labelKey === "services" ? "Services" : t(labelKey)}
            </a>
          ))}
          <Link
            href="/admin"
            className="ml-2 rounded-full border border-indigo-500/40 bg-indigo-600/20 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-600/40 hover:text-white"
          >
            {t("admin")}
          </Link>
        </nav>
      </div>
    </header>
  );
}