import { redirect } from "next/navigation";

export default function AdminPortfoliosRedirectPage() {
  redirect("/admin/settings");
}
