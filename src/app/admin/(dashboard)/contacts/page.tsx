import { AdminContactManager } from "../../../../components/admin/AdminContactManager";

export const metadata = {
  title: "Contacts | Admin",
};

export default function AdminContactsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Contacts</h1>
        <p className="mt-1 text-sm text-slate-600">Review inbound leads, update status, and export data.</p>
      </div>
      <AdminContactManager />
    </div>
  );
}
