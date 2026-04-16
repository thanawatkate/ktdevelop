import { redirect } from "next/navigation";
import { defaultLocale } from "../../i18n";

export default function ContactPage() {
  redirect(`/${defaultLocale}/contact`);
}