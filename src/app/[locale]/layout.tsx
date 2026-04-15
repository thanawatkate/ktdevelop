import type { Metadata } from "next";
import { SiteHeader } from "../../components/SiteHeader";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

const locales = ["th", "en"];

export const metadata: Metadata = {
  title: {
    default: "KT Develop",
    template: "%s | KT Develop",
  },
  description: "Corporate portfolio and contact platform built with Next.js, MySQL, and Clean Architecture.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: { locale: string };
}>) {
  if (!locales.includes(params.locale)) {
    notFound();
  }

  const langMap: Record<string, string> = {
    th: "th",
    en: "en",
  };

  return (
    <html lang={langMap[params.locale] || "en"}>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
