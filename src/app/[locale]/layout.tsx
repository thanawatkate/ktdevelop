import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "../../components/layout";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

const locales = ["th", "en"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isThai = locale === "th";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        th: "/th",
        en: "/en",
      },
    },
    openGraph: {
      title: "KT Develop",
      description: isThai
        ? "แพลตฟอร์มพอร์ตโฟลิโอองค์กรและบริการพัฒนาซอฟต์แวร์ระดับมืออาชีพ"
        : "Corporate portfolio and contact platform built with Next.js, MySQL, and Clean Architecture.",
      siteName: "KT Develop",
      type: "website",
      locale: isThai ? "th_TH" : "en_US",
      url: `/${locale}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}


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

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <SiteHeader />
      {children}
    </NextIntlClientProvider>
  );
}


