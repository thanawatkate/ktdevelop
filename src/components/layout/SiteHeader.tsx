"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "../i18n";

const navLinks = [
  { href: "#home", labelKey: "home" },
  { href: "#services", labelKey: "services" },
  { href: "#portfolio", labelKey: "portfolio" },
  { href: "#contact", labelKey: "contact" },
] as const;

export function SiteHeader() {
  const t = useTranslations("navigation");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMobileMenuOpen(false);
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
          className="text-lg font-bold tracking-tight text-white transition hover:text-indigo-300"
        >
          KT Develop
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex sm:gap-2">
          {navLinks.map(({ href, labelKey }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleAnchorClick(e, href)}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {t(labelKey)}
            </a>
          ))}
          <Link
            href="/admin"
            className="ml-2 rounded-full border border-indigo-500/40 bg-indigo-600/20 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-600/40 hover:text-white"
          >
            {t("admin")}
          </Link>
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
        </nav>

        {/* Mobile Actions: Language Switcher + Hamburger Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur md:hidden">
          <nav className="flex flex-col space-y-2">
            {navLinks.map(({ href, labelKey }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleAnchorClick(e, href)}
                className="rounded-xl px-4 py-3 text-base font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                {t(labelKey)}
              </a>
            ))}
            <div className="pt-2">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-4 py-3 text-center text-base font-medium text-indigo-300 transition hover:bg-indigo-600/40 hover:text-white"
              >
                {t("admin")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}