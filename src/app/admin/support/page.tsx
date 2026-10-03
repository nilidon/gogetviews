import Link from "next/link";
import { redirect } from "next/navigation";
import { SupportInbox } from "@/app/admin/support/SupportInbox";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseEnv } from "@/lib/supabase-env";
import { listSupportMessages } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const configured = supabaseEnv().configured;
  const messages = configured ? await listSupportMessages() : [];

  return (
    <div className="theme-dark min-h-screen">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Support messages</h1>
          <Link href="/admin" className="btn-ghost">
            Back to admin
          </Link>
        </div>
        {!configured ? (
          <p className="text-sm text-muted">Supabase is not connected yet.</p>
        ) : (
          <SupportInbox messages={messages} />
        )}
      </main>
    </div>
  );
}
