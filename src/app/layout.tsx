import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}