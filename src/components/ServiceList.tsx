"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { groupServicesByCategory } from "@/lib/service-groups";
import { formatUsdAmount } from "@/lib/pricing";
import type { ServiceWithPricing } from "@/types/service";

interface ServiceListProps {
  services: ServiceWithPricing[];
  selectedId: number | null;
  onSelect: (service: ServiceWithPricing) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

function ServiceRow({
  service,
  isSelected,
  onSelect,
}: {
  service: ServiceWithPricing;
  isSelected: boolean;
  onSelect: (service: ServiceWithPricing) => void;
}) {
  const min = Number.parseInt(service.min, 10);
  const max = Number.parseInt(service.max, 10);

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition-all duration-200 ${
        isSelected
          ? "border-primary/50 bg-primary/10"
          : "border-transparent bg-surface-2 hover:border-border hover:bg-surface-2/80"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-foreground/95">{service.displayName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {min.toLocaleString()} – {max.toLocaleString()}
          {service.refill ? " · Refill" : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <p className="whitespace-nowrap text-sm font-bold text-primary">
          {formatUsdAmount(service.retailRate)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ 1k</span>
        </p>
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
            isSelected ? "border-primary bg-primary" : "border-border bg-transparent"
          }`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}

export function ServiceList({
  services,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: ServiceListProps) {
  const groups = useMemo(() => groupServicesByCategory(services), [services]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setExpandedCategories(new Set());
  }, [services]);

  useEffect(() => {
    if (!selectedId) return;
    const group = groups.find((item) =>
      item.services.some((service) => service.service === selectedId),
    );
    if (!group) return;
    setExpandedCategories((prev) => new Set(prev).add(group.category));
  }, [selectedId, groups]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const isSearching = search.trim().length > 0;

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search followers, views, likes..."
      />

      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">No services match your search.</p>
          </div>
        ) : (
          groups.map((group) => {
            const isSingleService = group.services.length === 1;

            if (isSingleService) {
              const service = group.services[0];
              const isSelected = selectedId === service.service;

              return (
                <section
                  key={group.category}
                  className={`overflow-hidden rounded-xl border border-border bg-surface-2/50 p-2 ${
                    isSelected ? "ring-1 ring-inset ring-primary/40" : ""
                  }`}
                >
                  <ServiceRow
                    service={service}
                    isSelected={isSelected}
                    onSelect={onSelect}
                  />
                </section>
              );
            }

            const isOpen = isSearching || expandedCategories.has(group.category);
            const selectedInGroup = group.services.some(
              (service) => service.service === selectedId,
            );

            return (
              <section
                key={group.category}
                className="overflow-hidden rounded-xl border border-border bg-surface-2/50"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] ${
                    selectedInGroup && !isOpen ? "ring-1 ring-inset ring-primary/40" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{group.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {group.services.length} services
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-1.5 border-t border-border p-2">
                    {group.services.map((service) => (
                      <ServiceRow
                        key={service.service}
                        service={service}
                        isSelected={selectedId === service.service}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
