import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { SiteHeader } from "../../components/layout";
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

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <SiteHeader />
      {children}
    </NextIntlClientProvider>
  );
}
