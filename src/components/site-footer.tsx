import { Logo } from "@/components/logo";
import { PlatformIcon } from "@/components/platform-icon";
import { config } from "@/lib/config";
import { platformIconKey } from "@/lib/platforms";
import type { PlatformGroup } from "@/types/service";

const fallbackPlatforms = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
  "Twitch",
  "LinkedIn",
];

const columns = [
  { title: "Company", links: [{ label: "About", href: "#why-us" }, { label: "Contact", href: "#faq" }] },
  {
    title: "Support",
    links: [
      { label: "Orders", href: "/account" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  { title: "Legal", links: [{ label: "Terms", href: "#" }, { label: "Privacy", href: "#" }, { label: "Refunds", href: "#" }] },
];

export function SiteFooter({ platforms = [] }: { platforms?: PlatformGroup[] }) {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5">
            <Logo inverted />
            <p className="max-w-xs text-sm leading-relaxed text-ink-foreground/60">
              Social growth services for creators, brands and agencies on every major platform.
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Supported platforms">
              {(platforms.length > 0 ? platforms.map((platform) => platform.name) : fallbackPlatforms).map(
                (name) => (
                  <li
                    key={name}
                    title={name}
                    className="flex size-9 items-center justify-center rounded-lg border border-ink-foreground/15 text-ink-foreground/70"
                  >
                    <PlatformIcon id={platformIconKey(name)} className="size-4" />
                    <span className="sr-only">{name}</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-foreground/60 transition-colors hover:text-ink-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-ink-foreground/15 pt-8 text-xs text-ink-foreground/50 md:flex-row md:justify-between">
          <p>{`© ${new Date().getFullYear()} ${config.siteName}. All rights reserved.`}</p>
          <p>Not affiliated with Instagram, Facebook, TikTok, YouTube, Threads, Twitch or LinkedIn.</p>
        </div>
      </div>
    </footer>
  );
}
