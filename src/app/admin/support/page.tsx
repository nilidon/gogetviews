import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseEnv } from "@/lib/supabase-env";
import { listSupportMessages } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const messages = supabaseEnv().configured ? await listSupportMessages() : [];

  return (
    <div className="theme-dark min-h-screen">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Support messages</h1>
          <Link href="/admin" className="btn-ghost">
            Back to admin
          </Link>
        </div>
        {!supabaseEnv().configured ? (
          <p className="text-sm text-muted">Supabase is not connected yet.</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => (
              <li key={message.id} className="card">
                <p className="text-sm font-semibold">{message.email}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
