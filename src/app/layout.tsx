import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "KT Develop",
    template: "%s | KT Develop",
  },
  description: "Corporate portfolio and contact platform built with Next.js, MySQL, and Clean Architecture.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale = "th";
  try {
    locale = await getLocale();
  } catch {
    locale = "th";
  }

  return (
    <html lang={locale || "th"} suppressHydrationWarning>
      <body className={`${notoSansThai.variable} font-sans text-slate-900 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}