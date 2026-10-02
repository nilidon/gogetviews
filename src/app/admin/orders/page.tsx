import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAllOrders } from "@/lib/orders";
import { formatUsd } from "@/lib/pricing";
import { supabaseEnv } from "@/lib/supabase-env";
import type { StoredOrder } from "@/types/service";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  processing: "Processing",
  in_progress: "In progress",
  completed: "Completed",
  partial: "Partially delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

export default async function AdminOrdersPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const configured = supabaseEnv().configured;
  let orders: StoredOrder[] = [];
  let error: string | null = null;

  if (configured) {
    try {
      orders = await listAllOrders();
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : "Could not load orders.";
    }
  }

  return (
    <div className="theme-dark min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="mt-1 text-sm text-muted">{orders.length} shown</p>
          </div>
          <Link href="/admin" className="btn-ghost">
            Back to admin
          </Link>
        </div>

        {!configured ? (
          <p className="text-sm text-muted">
            Supabase is not connected yet. Add the project URL, anon key, and service role key to
            .env.local, then run the SQL in supabase/migrations.
          </p>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{order.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.serviceName}</p>
                      <p className="mt-1 text-xs text-muted">{order.platform}</p>
                    </td>
                    <td className="px-4 py-3">{order.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3">{formatUsd(order.amountCents)}</td>
                    <td className="px-4 py-3">{STATUS_LABELS[order.status] ?? order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
