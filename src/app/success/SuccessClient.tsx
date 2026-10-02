"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatUsd } from "@/lib/pricing";
import type { StoredOrder } from "@/types/service";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  processing: "Processing",
  in_progress: "In progress",
  completed: "Completed",
  partial: "Partially delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

export function SuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const response = await fetch(`/api/orders/${orderId}${query}`);
    const data = (await response.json()) as { order?: StoredOrder };
    if (data.order) setOrder(data.order);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    fetch("/api/account/me")
      .then((response) => response.json())
      .then((data: { account?: { email?: string } | null }) => {
        const email = data.account?.email ?? null;
        setSignedInEmail(email);
        if (email) setAccountReady(true);
      })
      .catch(() => undefined);
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, sessionId]);

  const saveAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderId || !order?.email) return;
    if (password.length < 8) {
      setAccountError("Use at least 8 characters.");
      return;
    }
    if (!accountExists && password !== confirmPassword) {
      setAccountError("Those passwords don't match.");
      return;
    }

    setSavingAccount(true);
    setAccountError(null);
    const response = await fetch(accountExists ? "/api/account/login" : "/api/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        accountExists ? { email: order.email, password } : { orderId, password },
      ),
    });
    const data = (await response.json()) as { error?: string; code?: string };
    setSavingAccount(false);

    if (response.status === 409 || data.code === "exists") {
      setAccountExists(true);
      setAccountError("An account already exists for this email. Enter your password to sign in.");
      return;
    }
    if (!response.ok) {
      setAccountError(data.error ?? "Could not save your account.");
      return;
    }

    setAccountReady(true);
    setSignedInEmail(order.email);
  };

  const copyId = async () => {
    if (!orderId) return;
    await navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto max-w-lg">
          {loading ? (
            <div className="flex flex-col items-center py-24 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
              <p className="mt-4 text-sm">Loading your order...</p>
            </div>
          ) : !orderId || !order ? (
            <div className="card text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-400" />
              <h1 className="mt-4 text-xl font-semibold">Order not found</h1>
              <Link href="/" className="btn-primary mt-6 inline-flex">
                Back to home
              </Link>
            </div>
          ) : (
            <div className="card">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h1 className="mt-5 text-2xl font-bold">Payment successful</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your order is being processed. Save your order ID to track delivery.
                </p>
              </div>

              <div className="mt-8 rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order ID
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-sm">{order.id}</code>
                  <button type="button" onClick={copyId} className="btn-ghost shrink-0 px-3 py-2">
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <dl className="mt-6 space-y-3 text-sm">
                {[
                  ["Service", order.serviceName],
                  ["Platform", order.platform],
                  ["Quantity", order.quantity.toLocaleString()],
                  ["Paid", formatUsd(order.amountCents)],
                  ["Status", STATUS_LABELS[order.status] ?? order.status],
                  order.deliveryStatus ? ["Delivery", order.deliveryStatus] : null,
                  order.remains ? ["Remaining", order.remains] : null,
                ]
                  .filter(Boolean)
                  .map((row) => {
                    const [label, value] = row as [string, string];
                    return (
                      <div key={label} className="flex justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-right font-medium">{value}</dd>
                      </div>
                    );
                  })}
              </dl>

              {order.error && (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {order.error}
                </p>
              )}

              <div className="mt-8 rounded-xl border border-border bg-surface-2 p-4">
                {!order.email ? (
                  <p className="text-sm text-muted-foreground">
                    Loading the email from your payment...
                  </p>
                ) : accountReady && signedInEmail === order.email ? (
                  <div>
                    <p className="font-semibold">This order is saved to your account</p>
                    <p className="mt-1 text-sm text-muted-foreground">{order.email}</p>
                    <Link href="/account" className="btn-primary mt-4 inline-flex">
                      Go to your account
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={saveAccount}>
                    <p className="font-semibold">
                      {accountExists ? "Sign in to save this order" : "Create a password"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your payment email is {order.email}. Set a password to track orders, contact
                      support, and place new orders.
                    </p>
                    <label className="mt-4 block">
                      <span className="label">Password</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={accountExists ? "current-password" : "new-password"}
                        className="input"
                        minLength={8}
                        required
                      />
                    </label>
                    {!accountExists && (
                      <label className="mt-4 block">
                        <span className="label">Confirm password</span>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          autoComplete="new-password"
                          className="input"
                          minLength={8}
                          required
                        />
                      </label>
                    )}
                    {accountError && <p className="mt-3 text-sm text-red-700">{accountError}</p>}
                    <button type="submit" disabled={savingAccount} className="btn-primary mt-4 w-full">
                      {savingAccount ? "Saving..." : accountExists ? "Sign in" : "Create account"}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/account" className="btn-primary flex-1">
                  View your orders
                </Link>
                <button type="button" onClick={fetchOrder} className="btn-ghost flex-1">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
