"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatUsd } from "@/lib/pricing";
import type { StoredOrder } from "@/types/service";

export function TrackClient() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("order") ?? "");
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${id.trim()}`);
      const data = (await response.json()) as { order?: StoredOrder; error?: string };
      if (!response.ok || !data.order) {
        throw new Error(data.error ?? "Order not found");
      }
      setOrder(data.order);
    } catch (lookupError) {
      setOrder(null);
      setError(
        lookupError instanceof Error ? lookupError.message : "Lookup failed",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get("order");
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    lookup(orderId);
  };

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Track your order</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the order ID from your confirmation email or success page.
            </p>
          </div>

          <form onSubmit={onSubmit} className="card">
            <label className="label">Order ID</label>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Paste your order ID here"
              className="input"
            />
            <button
              type="submit"
              disabled={loading || !orderId.trim()}
              className="btn-primary mt-4 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Track order
                </>
              )}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {order && (
            <div className="card mt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{order.serviceName}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{order.platform}</p>
                </div>
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold capitalize text-accent">
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>

              <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
                {[
                  ["Link", order.link],
                  ["Quantity", order.quantity.toLocaleString()],
                  ["Paid", formatUsd(order.amountCents)],
                  order.deliveryStatus ? ["Delivery", order.deliveryStatus] : null,
                  order.remains ? ["Remaining", order.remains] : null,
                ]
                  .filter(Boolean)
                  .map((row) => {
                    const [label, value] = row as [string, string];
                    return (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className={`max-w-[55%] text-right ${label === "Link" ? "truncate" : "font-medium"}`}>
                          {value}
                        </dd>
                      </div>
                    );
                  })}
              </dl>

              <button
                type="button"
                onClick={() => lookup(order.id)}
                className="btn-ghost mt-6 w-full"
              >
                Refresh status
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-accent hover:text-accent-hover">
              Place a new order →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
