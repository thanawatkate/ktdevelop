import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${notoSansThai.variable} font-sans text-slate-900 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}