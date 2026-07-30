import { ReactNode } from "react";
import { cookies } from "next/headers";
import { AdminAuthGate } from "../../../components/admin/AdminAuthGate";
import { AdminShell } from "../../../components/admin/AdminShell";
import { isSessionAuthorizedByValue } from "../../../core/security/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const providedToken = (await cookies()).get("admin_session")?.value?.trim() || null;
  const initialAuthorized = isSessionAuthorizedByValue(providedToken);

  return (
    <AdminAuthGate initialAuthorized={initialAuthorized}>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGate>
  );
}
