import { ReactNode } from "react";
import { Noto_Sans_Thai } from "next/font/google";
import "../globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${notoSansThai.variable} font-sans text-slate-900 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

