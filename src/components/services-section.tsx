"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import { getPlatformBrand } from "@/lib/platform-brands";
import { platformIconKey } from "@/lib/platforms";
import { formatUsdAmount } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { PlatformGroup, ServiceWithPricing } from "@/types/service";

const number = new Intl.NumberFormat("en-US");

interface ServicesSectionProps {
  platforms: PlatformGroup[];
  services: ServiceWithPricing[];
  selectedPlatform?: string | null;
  onPlatformChange?: (platform: string) => void;
  onOrder: (service: ServiceWithPricing) => void;
}

export function ServicesSection({
  platforms,
  services,
  selectedPlatform,
  onPlatformChange,
  onOrder,
}: ServicesSectionProps) {
  const [active, setActive] = useState(platforms[0]?.name ?? "Instagram");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const currentName = selectedPlatform ?? active;
  const platform = platforms.find((item) => item.name === currentName) ?? platforms[0];

  function selectPlatform(name: string) {
    setActive(name);
    onPlatformChange?.(name);
  }

  const visible = useMemo(
    () => services.filter((service) => service.platform === platform?.name),
    [platform?.name, services],
  );

  if (!platform) return null;

  return (
    <section id="services" className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-primary">Services</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Place an order
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Platforms"
          className="mt-10 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]"
        >
          {platforms.map((item) => {
            const selected = item.name === platform.name;
            const brand = getPlatformBrand(item.name);
            const iconColor = brand.color.toLowerCase() === "#ffffff" ? "#111111" : brand.color;
            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls="services-panel"
                onClick={() => selectPlatform(item.name)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-2 bg-card px-5 text-sm font-semibold text-foreground transition-colors",
                  selected ? "" : "border-border hover:border-foreground/30",
                )}
                style={
                  selected
                    ? { borderColor: iconColor, backgroundColor: `${iconColor}14` }
                    : undefined
                }
              >
                <span className="inline-flex" style={{ color: iconColor }}>
                  <PlatformIcon id={item.id} className="size-4" />
                </span>
                {item.name}
              </button>
            );
          })}
        </div>

        <div
          id="services-panel"
          role="tabpanel"
          aria-labelledby={`tab-${platform.id}`}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visible.map((service) => {
            const selected = service.service === selectedId;
            const min = Number.parseInt(service.min, 10);
            const max = Number.parseInt(service.max, 10);

            return (
              <article
                key={service.service}
                data-selected={selected ? "true" : "false"}
                onClick={() => setSelectedId(service.service)}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-2xl border-2 bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-foreground/5",
                  selected ? "border-primary" : "border-border",
                )}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PlatformIcon id={platformIconKey(platform.name)} className="size-4" />
                  <span className="text-xs font-medium">{platform.name}</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold">{service.displayName}</h3>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">
                    {formatUsdAmount(service.retailRate)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 1K</span>
                </div>

                <dl className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Min / Max</dt>
                    <dd className="text-right font-medium">
                      {number.format(min)} – {number.format(max)}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(service.service);
                    onOrder(service);
                  }}
                  className={cn(
                    "mt-6 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary text-secondary-foreground hover:bg-border",
                  )}
                >
                  Order now
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
