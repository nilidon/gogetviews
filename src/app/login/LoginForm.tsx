"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signingUp = mode === "signup";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (signingUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const response = await fetch(signingUp ? "/api/account/signup" : "/api/account/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? (signingUp ? "Could not create an account." : "Could not sign in."));
      return;
    }
    window.location.href = "/account";
  };

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="card">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {signingUp ? "Create an account" : "Sign in"}
            </h1>
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
              <label>
                <span className="label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="input"
                />
              </label>
              <label>
                <span className="label">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete={signingUp ? "new-password" : "current-password"}
                  minLength={signingUp ? 8 : undefined}
                  className="input"
                />
              </label>
              {signingUp && (
                <label>
                  <span className="label">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="input"
                  />
                </label>
              )}
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : signingUp ? "Create account" : "Sign in"}
              </button>
            </form>
            {signingUp ? (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="mt-4 text-sm font-semibold text-primary"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="mt-4 text-sm font-semibold text-primary"
              >
                Don&apos;t have an account? Sign up
              </button>
            )}
            <Link href="/" className="mt-3 block text-sm font-semibold text-primary">
              Back to the site
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
