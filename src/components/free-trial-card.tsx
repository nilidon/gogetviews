"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Gift } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import { getPlatformBrand } from "@/lib/platform-brands";
import { platformIconKey } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { PlatformGroup } from "@/types/service";

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

interface FreeTrialCardProps {
  platforms: PlatformGroup[];
  onClaim: (input: { platform: string; link: string }) => void;
  tone?: "light" | "dark";
}

export function FreeTrialCard({ platforms, onClaim, tone = "light" }: FreeTrialCardProps) {
  const fallback = platforms.find((item) => item.id === "instagram") ?? platforms[0];
  const [platform, setPlatform] = useState(fallback?.name ?? "Instagram");
  const [error, setError] = useState<string | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showSent, setShowSent] = useState(false);

  useEffect(() => {
    if (!showSent) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSent(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [showSent]);
  const selected = platforms.find((item) => item.name === platform) ?? fallback;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const link = String(form.get("link") ?? "").trim();
    if (!selected || !link) return;

    setError(null);
    setAlreadyClaimed(false);
    setPending(true);
    try {
      const response = await fetch("/api/free-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: selected.name, link }),
      });
      const data = (await response.json()) as { error?: string; code?: string };
      if (!response.ok) {
        setAlreadyClaimed(data.code === "already_claimed");
        setError(data.error ?? "We couldn't claim free views for this profile.");
        return;
      }
      setSent(true);
      setShowSent(true);
      onClaim({ platform: selected.name, link });
    } catch {
      setError("We couldn't check this profile. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      id="free-trial"
      className={cn(
        "scroll-mt-28 rounded-3xl border p-6 shadow-2xl md:p-8",
        tone === "dark"
          ? "border-white/15 bg-white/10 text-white shadow-sky-500/20 backdrop-blur-md"
          : "border-border bg-card shadow-primary/15",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Gift className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className={cn("font-display text-xl font-bold leading-tight", tone === "dark" ? "text-white" : "text-foreground")}>
            Claim 10,000 free views
          </h2>
          <p className={cn("text-sm", tone === "dark" ? "text-white/60" : "text-muted-foreground")}>
            A one-time welcome gift
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <fieldset>
          <legend className={cn("mb-3 text-sm font-semibold", tone === "dark" ? "text-white" : "text-foreground")}>
            1. Pick a platform
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {platforms.map((item) => {
              const active = item.name === platform;
              const brand = getPlatformBrand(item.name);
              const iconColor = brand.color.toLowerCase() === "#ffffff" ? "#111111" : brand.color;

              return (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-background px-3 py-3 transition-colors sm:px-4",
                    active ? "" : "border-border hover:border-foreground/25",
                    tone === "dark" && !active && "border-white/15 bg-white/5",
                  )}
                  style={
                    active
                      ? { borderColor: iconColor, backgroundColor: `${iconColor}12` }
                      : undefined
                  }
                >
                  <input
                    type="radio"
                    name="platform"
                    value={item.name}
                    checked={active}
                    onChange={() => {
                      setPlatform(item.name);
                      setError(null);
                      setAlreadyClaimed(false);
                      setSent(false);
                      setShowSent(false);
                    }}
                    className="sr-only"
                  />
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={
                      brand.gradient
                        ? { background: brand.gradient }
                        : { backgroundColor: iconColor }
                    }
                  >
                    <PlatformIcon id={platformIconKey(item.name)} className="size-6" />
                  </span>
                  <span className={cn("text-sm font-semibold", tone === "dark" ? "text-white" : "text-foreground")}>
                    {item.name}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
            <label htmlFor="trial-link" className={cn("text-sm font-semibold", tone === "dark" ? "text-white" : "text-foreground")}>
            {selected ? `2. Paste your ${selected.name} video link` : "2. Paste your video link"}
          </label>
          <input
            id="trial-link"
            name="link"
            type="url"
            required
              placeholder={`https://${platformIconKey(selected?.name ?? "instagram")}.com/...`}
              className={cn(inputClass, tone === "dark" && "border-white/15 bg-white/5 text-white placeholder:text-white/40")}
            onInput={() => {
              setError(null);
              setAlreadyClaimed(false);
              setSent(false);
              setShowSent(false);
            }}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium leading-relaxed text-destructive">
            {alreadyClaimed ? (
              <>
                {error}{" "}
                <button
                  type="button"
                  onClick={() => {
                    const field = document.getElementById("trial-link") as HTMLInputElement | null;
                    onClaim({ platform: selected?.name ?? platform, link: field?.value.trim() ?? "" });
                  }}
                  className="font-semibold underline decoration-2 underline-offset-2 hover:text-foreground"
                >
                  Place an order to proceed.
                </button>
              </>
            ) : (
              error
            )}
          </p>
        )}

          <button
          type="submit"
          disabled={pending || sent}
          className="group mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:bg-ink disabled:translate-y-0 disabled:opacity-70"
        >
          {pending ? "Sending your free views..." : "Claim my 10,000 free views"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </form>

      {showSent &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-5"
            onClick={() => setShowSent(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="free-views-sent-title"
              className="w-full max-w-md rounded-3xl border border-border bg-card px-8 py-10 text-center shadow-2xl shadow-primary/20"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Check className="size-7" aria-hidden="true" />
              </span>
              <p
                id="free-views-sent-title"
                className="mt-5 font-display text-2xl font-bold leading-tight text-foreground"
              >
                Your 10,000 free views are on the way.
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => setShowSent(false)}
                className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:bg-ink"
              >
                Got it
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
