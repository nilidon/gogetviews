"use client";

import { FormEvent, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function ContactForm({ email = "" }: { email?: string }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState(email);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setState("sending");
    setError(null);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: address, message }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setState("error");
      setError(data.error ?? "Could not send your message.");
      return;
    }
    setName("");
    setMessage("");
    setState("sent");
  };

  return (
    <>
      <Header signedIn={Boolean(email)} />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto max-w-xl">
          <div className="card">
            <p className="text-sm font-semibold text-primary">Contact</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Send a message</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tell us what you need. We read every message in the admin panel and reply there.
            </p>
            {state === "sent" ? (
              <p className="mt-6 text-sm font-medium text-foreground">
                Message sent. If you use this email on an account, the reply will show there.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                <label>
                  <span className="label">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                    autoComplete="name"
                    className="input"
                  />
                </label>
                <label>
                  <span className="label">Email</span>
                  <input
                    type="email"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    required
                    autoComplete="email"
                    readOnly={Boolean(email)}
                    className="input"
                  />
                </label>
                <label>
                  <span className="label">Message</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                    minLength={5}
                    rows={6}
                    className="input resize-none"
                    placeholder="How can we help?"
                  />
                </label>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={state === "sending"} className="btn-primary">
                  {state === "sending" ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
