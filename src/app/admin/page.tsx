import { AdminPortfolioManager } from "../../components/admin/AdminPortfolioManager";
import { AdminContactManager } from "../../components/admin/AdminContactManager";
import { AdminContactAuditLog } from "../../components/admin/AdminContactAuditLog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <AdminPortfolioManager />
        <AdminContactManager />
        <AdminContactAuditLog />
      </div>
    </main>
  );
}