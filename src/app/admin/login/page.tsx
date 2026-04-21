import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLoginForm } from "../../../components/admin/AdminLoginForm";
import { isSessionAuthorizedByValue } from "../../../core/security/adminAuth";

export default async function AdminLoginPage() {
  const providedToken = (await cookies()).get("admin_session")?.value?.trim() || null;
  const isAuthorized = isSessionAuthorizedByValue(providedToken);

  if (isAuthorized) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}