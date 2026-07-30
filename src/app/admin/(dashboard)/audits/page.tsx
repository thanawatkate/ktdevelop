import { redirect } from "next/navigation";

export default function AdminAuditsRedirectPage() {
  redirect("/admin/settings");
}
