"use client";

import { useTranslations } from "next-intl";
import { Portfolio } from "../../infrastructure/repositories/PortfolioRepository";

interface PortfolioGridProps {
  portfolios: Portfolio[];
  translations?: {
    label?: string;
    emptyTitle?: string;
    emptyDescription?: string;
  };
}

export function PortfolioGrid({ portfolios, translations }: PortfolioGridProps) {
  let t: (key: string) => string;
  try {
    t = useTranslations("portfolio");
  } catch {
    t = (key: string) => key;
  }

  const label = translations?.label ?? t("label");
  const emptyTitle = translations?.emptyTitle ?? t("emptyTitle");
  const emptyDescription = translations?.emptyDescription ?? t("emptyDescription");

  if (!portfolios.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
          {label}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">{emptyTitle}</h2>
        <p className="mt-3 text-base text-slate-600">
          {emptyDescription}
        </p>
      </section>
    );
  }


  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {portfolios.map((portfolio) => (
        <article
          key={portfolio.id}
          className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
            {portfolio.image_url ? (
              <img
                src={portfolio.image_url}
                alt={portfolio.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-sm font-medium text-slate-500">
                Project Preview
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                {portfolio.client_name}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{portfolio.title}</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm leading-7 text-slate-600">{portfolio.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}