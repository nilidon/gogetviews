"use client";

import { useState } from "react";
import type { SupportMessage } from "@/types/support";

export function SupportInbox({ messages }: { messages: SupportMessage[] }) {
  const [items, setItems] = useState(messages);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(messages.map((message) => [message.id, message.reply ?? ""])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveReply = async (id: string) => {
    setSaving(id);
    setError(null);
    const response = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reply: drafts[id] ?? "" }),
    });
    const data = (await response.json()) as { error?: string; message?: SupportMessage };
    setSaving(null);
    if (!response.ok || !data.message) {
      setError(data.error ?? "Could not save the reply.");
      return;
    }
    setItems((current) => current.map((item) => (item.id === id ? data.message! : item)));
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted">No messages yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {error && <li className="text-sm text-red-300">{error}</li>}
      {items.map((message) => (
        <li key={message.id} className="card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">{message.name ? `${message.name} · ${message.email}` : message.email}</p>
            <p className="text-xs text-muted">{message.reply ? "Replied" : "New"}</p>
          </div>
          <p className="mt-1 text-xs text-muted">{new Date(message.createdAt).toLocaleString()}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>
          <label className="mt-4 block">
            <span className="label">Reply</span>
            <textarea
              value={drafts[message.id] ?? ""}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, [message.id]: event.target.value }))
              }
              rows={4}
              className="input resize-none"
              placeholder="Write your reply"
            />
          </label>
          <button
            type="button"
            disabled={saving === message.id}
            onClick={() => saveReply(message.id)}
            className="btn-primary mt-3"
          >
            {saving === message.id ? "Saving..." : message.reply ? "Update reply" : "Send reply"}
          </button>
        </li>
      ))}
    </ul>
  );
}
