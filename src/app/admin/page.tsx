import { AdminPortfolioManager } from "../../components/admin/AdminPortfolioManager";
import { AdminContactManager } from "../../components/admin/AdminContactManager";
import { AdminContactAuditLog } from "../../components/admin/AdminContactAuditLog";
import { AdminContentManager } from "../../components/admin/AdminContentManager";
import { AdminAuthGate } from "../../components/admin/AdminAuthGate";
import { cookies } from "next/headers";
import { isSessionAuthorizedByValue } from "../../core/security/adminAuth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const providedToken = (await cookies()).get("admin_session")?.value?.trim() || null;
  const initialAuthorized = isSessionAuthorizedByValue(providedToken);

  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-16 pt-6 text-slate-900 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <AdminAuthGate initialAuthorized={initialAuthorized}>
          <AdminContentManager />
          <AdminPortfolioManager />
          <AdminContactManager />
          <AdminContactAuditLog />
        </AdminAuthGate>
      </div>
    </main>
  );
}