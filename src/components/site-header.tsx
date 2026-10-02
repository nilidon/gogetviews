"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";

const links = [
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#why-us", label: "Why us" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader({
  signedIn,
  freeViewsClaimed = false,
}: {
  signedIn?: boolean;
  freeViewsClaimed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(
    signedIn ? "account" : null,
  );
  const [claimedFreeViews, setClaimedFreeViews] = useState(freeViewsClaimed);

  useEffect(() => {
    if (signedIn) return;
    fetch("/api/account/me")
      .then((response) => response.json())
      .then((data: { account?: { email?: string; freeViewsClaimed?: boolean } | null }) => {
        setAccountEmail(data.account?.email ?? "");
        setClaimedFreeViews(Boolean(data.account?.freeViewsClaimed));
      })
      .catch(() => setAccountEmail(""));
  }, [signedIn]);

  const hasAccount = signedIn || Boolean(accountEmail);
  const showFreeViews = !claimedFreeViews;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
      {showFreeViews && (
        <a
          href="/#free-trial"
          className="flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-ink"
        >
          <span>
            New here? Get <strong className="font-extrabold">100,000 FREE views</strong>
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            {"→"}
          </span>
        </a>
      )}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {hasAccount ? (
            <a href="/account" className="text-sm font-medium text-foreground hover:text-primary">
              Account
            </a>
          ) : (
            <a href="/login" className="text-sm font-medium text-foreground hover:text-primary">
              Sign in
            </a>
          )}
          {showFreeViews && (
            <a
              href="/#free-trial"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-ink"
            >
              Get 100K free views
            </a>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="flex flex-col gap-1 border-t border-border bg-background px-5 py-4 md:hidden"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
            >
              {link.label}
            </a>
          ))}
          {hasAccount ? (
            <a
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
            >
              Account
            </a>
          ) : (
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
            >
              Sign in
            </a>
          )}
          {showFreeViews && (
            <a
              href="/#free-trial"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-ink-foreground"
            >
              Get 100K free views
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
