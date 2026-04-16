"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const t = useTranslations("common");

  const otherLocale = locale === "th" ? "en" : "th";
  const otherLanguage = locale === "th" ? t("english") : t("thai");
  const strippedPath = pathname.replace(/^\/(th|en)(?=\/|$)/, "") || "/";
  const targetPath = `/${otherLocale}${strippedPath === "/" ? "" : strippedPath}`;

  return (
    <Link
      href={targetPath}
      className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
      title={`Switch to ${otherLanguage}`}
    >
      {otherLanguage}
    </Link>
  );
}
