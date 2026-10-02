"use client";

import { Check } from "lucide-react";
import { getPlatformBrand } from "@/lib/platform-brands";
import type { PlatformGroup } from "@/types/service";

interface PlatformGridProps {
  platforms: PlatformGroup[];
  selected: string | null;
  onSelect: (platform: string) => void;
}

export function PlatformGrid({ platforms, selected, onSelect }: PlatformGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {platforms.map((platform) => {
        const brand = getPlatformBrand(platform.name);
        const isSelected = selected === platform.name;

        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => onSelect(platform.name)}
            className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
              isSelected
                ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
                : "border-border bg-surface-2 hover:border-white/15 hover:bg-surface-2/80"
            }`}
            style={
              isSelected
                ? { boxShadow: `0 0 0 1px ${brand.ring}, 0 8px 24px -8px ${brand.ring}` }
                : undefined
            }
          >
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{
                background: brand.gradient ?? brand.color,
                color: platform.name === "Twitter" || platform.name === "Threads" ? "#000" : "#fff",
              }}
            >
              {brand.abbr}
            </div>
            <p className="text-sm font-semibold">{platform.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {platform.serviceCount} services
            </p>
            {isSelected && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
