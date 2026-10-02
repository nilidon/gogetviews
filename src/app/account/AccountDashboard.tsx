"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatUsd } from "@/lib/pricing";

interface AccountOrder {
  id: string;
  serviceName: string;
  platform: string;
  quantity: number;
  amountCents: number;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  processing: "Processing",
  in_progress: "In progress",
  completed: "Completed",
  partial: "Partially delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

export function AccountDashboard({
  email,
  freeViewsClaimed = false,
}: {
  email: string;
  freeViewsClaimed?: boolean;
}) {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [supportState, setSupportState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [supportError, setSupportError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((response) => response.json())
      .then((data: { orders?: AccountOrder[] }) => setOrders(data.orders ?? []))
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await fetch("/api/account/logout", { method: "POST" });
    window.location.href = "/";
  };

  const sendSupport = async (event: FormEvent) => {
    event.preventDefault();
    setSupportState("sending");
    setSupportError(null);
    const response = await fetch("/api/account/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setSupportState("error");
      setSupportError(data.error ?? "Could not send your message.");
      return;
    }
    setMessage("");
    setSupportState("sent");
  };

  return (
    <>
      <Header signedIn freeViewsClaimed={freeViewsClaimed} />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Account</p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Your orders</h1>
              <p className="mt-2 text-sm text-muted-foreground">{email}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/#services" className="btn-primary">
                Place a new order
              </Link>
              <button type="button" onClick={signOut} className="btn-ghost">
                Sign out
              </button>
            </div>
          </div>

          <section className="card">
            <h2 className="text-lg font-semibold">Orders</h2>
            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No orders yet. Place one and it will show up here.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {orders.map((order) => (
                  <li key={order.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{order.serviceName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.quantity.toLocaleString()} · {formatUsd(order.amountCents)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold">Contact support</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll reply to {email}.
            </p>
            <form onSubmit={sendSupport} className="mt-4">
              <label className="block">
                <span className="label">Message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  required
                  minLength={5}
                  className="input resize-none"
                  placeholder="Tell us what you need help with"
                />
              </label>
              {supportError && <p className="mt-3 text-sm text-red-700">{supportError}</p>}
              {supportState === "sent" && (
                <p className="mt-3 text-sm text-foreground">Message sent. We&apos;ll reply to {email}.</p>
              )}
              <button type="submit" disabled={supportState === "sending"} className="btn-primary mt-4">
                {supportState === "sending" ? "Sending..." : "Send message"}
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
