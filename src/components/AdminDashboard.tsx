"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Loader2,
  LogOut,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { sortServicesForSite } from "@/lib/display-order";
import { formatUsdAmount } from "@/lib/pricing";
import { SearchInput } from "@/components/SearchInput";

interface AdminServiceRow {
  service: number;
  name: string;
  displayName: string;
  apiName: string;
  category: string;
  categoryLabel: string;
  platform: string;
  wholesaleRatePer1000: number;
  defaultRetailRatePer1000: number;
  retailRatePer1000: number;
  enabled: boolean;
  hasCustomPrice: boolean;
  hasCustomName: boolean;
  sortOrder?: number;
}

interface AdminGroup {
  category: string;
  label: string;
  apiLabel: string;
  hasCustomName: boolean;
  services: AdminServiceRow[];
}

interface AdminData {
  platforms: string[];
  groups: AdminGroup[];
  stats: { total: number; enabled: number; disabled: number };
}

type VisibilityTab = "active" | "hidden";

export function AdminDashboard() {
  const router = useRouter();
  const [platform, setPlatform] = useState("Instagram");
  const [visibilityTab, setVisibilityTab] = useState<VisibilityTab>("active");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<number | null>(null);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [editingService, setEditingService] = useState<number | null>(null);
  const [nameDrafts, setNameDrafts] = useState<Record<number, string>>({});
  const [reordering, setReordering] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/services?platform=${encodeURIComponent(platform)}`);
    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await response.json()) as AdminData;
    setData(json);
    setPriceDrafts({});
    setCategoryDrafts({});
    setNameDrafts({});
    setEditingCategory(null);
    setEditingService(null);
    setLoading(false);
  }, [platform, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setVisibilityTab("active");
    setExpanded(new Set());
    setSearch("");
  }, [platform]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const updateService = async (
    serviceId: number,
    patch: { enabled?: boolean; retailRatePer1000?: number | null; displayName?: string | null },
  ) => {
    setSaving(serviceId);
    const response = await fetch(`/api/admin/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(null);
    if (!response.ok) return;
    await load();
  };

  const updateCategory = async (category: string, displayName: string | null) => {
    setSavingCategory(category);
    const response = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, displayName }),
    });
    setSavingCategory(null);
    setEditingCategory(null);
    if (!response.ok) return;
    await load();
  };

  const setPlatformEnabled = async (enabled: boolean) => {
    setBulkLoading(true);
    const response = await fetch("/api/admin/services/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, enabled }),
    });
    setBulkLoading(false);
    if (!response.ok) return;
    await load();
  };

  const reorderItem = async (
    type: "category" | "service" | "site",
    category: string,
    direction: "up" | "down",
    serviceId?: number,
  ) => {
    const key = type === "category" ? `category:${category}` : `service:${serviceId}`;
    setReordering(key);
    const response = await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        type,
        category,
        serviceId,
        direction,
        enabledOnly: visibilityTab === "active",
      }),
    });
    setReordering(null);
    if (!response.ok) return;
    await load();
  };

  const toggleCategory = (category: string) => {
    if (editingCategory === category) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const filteredGroups =
    data?.groups
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => {
          const matchesTab =
            visibilityTab === "active" ? service.enabled : !service.enabled;
          if (!matchesTab) return false;
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return (
            service.displayName.toLowerCase().includes(q) ||
            service.apiName.toLowerCase().includes(q) ||
            group.label.toLowerCase().includes(q) ||
            group.apiLabel.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((group) => group.services.length > 0) ?? [];

  const isSearching = search.trim().length > 0;
  const siteOrder = visibilityTab === "active" && !isSearching;
  const displayGroups: AdminGroup[] = siteOrder
    ? [
        {
          category: "__site__",
          label: "Order on the site",
          apiLabel: "",
          hasCustomName: false,
          services: sortServicesForSite(filteredGroups.flatMap((group) => group.services)),
        },
      ]
    : filteredGroups;

  const saveCategoryName = (category: string, apiLabel: string) => {
    const draft = (categoryDrafts[category] ?? "").trim();
    if (!draft || draft === apiLabel) {
      setEditingCategory(null);
      setCategoryDrafts((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
      return;
    }
    updateCategory(category, draft);
  };

  const saveServiceName = (service: AdminServiceRow) => {
    const draft = (nameDrafts[service.service] ?? "").trim();
    if (!draft || draft === service.apiName) {
      setEditingService(null);
      setNameDrafts((prev) => {
        const next = { ...prev };
        delete next[service.service];
        return next;
      });
      return;
    }
    updateService(service.service, { displayName: draft });
    setEditingService(null);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold">GoGetViews Admin</p>
            {data && (
              <p className="text-xs text-muted">
                {data.stats.enabled} enabled · {data.stats.disabled} hidden
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/orders" className="btn-ghost">
              Orders
            </a>
            <a href="/admin/support" className="btn-ghost">
              Support
            </a>
            <button type="button" onClick={logout} className="btn-ghost">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {data?.platforms.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setPlatform(name)}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  platform === name
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border text-muted hover:border-white/15 hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {visibilityTab === "hidden" ? (
              <button
                type="button"
                disabled={bulkLoading || loading}
                onClick={() => setPlatformEnabled(true)}
                className="btn-ghost text-xs sm:text-sm"
              >
                Enable all
              </button>
            ) : (
              <button
                type="button"
                disabled={bulkLoading || loading}
                onClick={() => setPlatformEnabled(false)}
                className="btn-ghost text-xs text-red-300 sm:text-sm hover:text-red-200"
              >
                Disable all
              </button>
            )}
          </div>
        </div>

        {data && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibilityTab("active")}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  visibilityTab === "active"
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border text-muted hover:border-white/15 hover:text-foreground"
                }`}
              >
                Active ({data.stats.enabled})
              </button>
              <button
                type="button"
                onClick={() => setVisibilityTab("hidden")}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  visibilityTab === "hidden"
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border text-muted hover:border-white/15 hover:text-foreground"
                }`}
              >
                Hidden ({data.stats.disabled})
              </button>
            </div>
            <p className="text-xs text-muted">
              {platform} · {visibilityTab === "active" ? "visible on site" : "not shown to customers"}
              {visibilityTab === "active" && " · use arrows to set display order"}
            </p>
          </div>
        )}

        <div className="mb-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search services or categories..."
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted">
              {visibilityTab === "active"
                ? "No active services for this platform."
                : "No hidden services for this platform."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayGroups.map((group, groupIndex) => {
              const siteList = group.category === "__site__";
              const isOpen = siteList || isSearching || expanded.has(group.category);
              const isEditingGroup = editingCategory === group.category;
              const categoryDraft =
                categoryDrafts[group.category] ?? group.label;

              return (
                <section
                  key={group.category}
                  className="overflow-hidden rounded-xl border border-border bg-surface/60"
                >
                  <div className="flex items-center gap-2 px-4 py-3.5 hover:bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={() => {
                        if (!siteList) toggleCategory(group.category);
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        {isEditingGroup ? (
                          <input
                            type="text"
                            value={categoryDraft}
                            autoFocus
                            disabled={savingCategory === group.category}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              setCategoryDrafts((prev) => ({
                                ...prev,
                                [group.category]: event.target.value,
                              }))
                            }
                            onBlur={() => saveCategoryName(group.category, group.apiLabel)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                (event.target as HTMLInputElement).blur();
                              }
                              if (event.key === "Escape") {
                                setEditingCategory(null);
                                setCategoryDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[group.category];
                                  return next;
                                });
                              }
                              event.stopPropagation();
                            }}
                            className="input w-full py-1.5 text-sm font-semibold"
                          />
                        ) : (
                          <>
                            <p className="text-sm font-semibold">{group.label}</p>
                            {group.hasCustomName && (
                              <p className="mt-0.5 truncate text-xs text-muted">
                                API: {group.apiLabel}
                              </p>
                            )}
                          </>
                        )}
                        <p className="mt-0.5 text-xs text-muted">
                          {group.services.length} service
                          {group.services.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      {!siteList && (
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      )}
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      {!isSearching && !siteList && (
                        <div className="flex flex-col">
                          <button
                            type="button"
                            title="Move category up"
                            disabled={
                              groupIndex === 0 ||
                              reordering !== null ||
                              savingCategory === group.category
                            }
                            onClick={() => reorderItem("category", group.category, "up")}
                            className="btn-ghost px-1.5 py-0.5 text-xs"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move category down"
                            disabled={
                              groupIndex === displayGroups.length - 1 ||
                              reordering !== null ||
                              savingCategory === group.category
                            }
                            onClick={() => reorderItem("category", group.category, "down")}
                            className="btn-ghost px-1.5 py-0.5 text-xs"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      {!isEditingGroup && !siteList && (
                        <button
                          type="button"
                          title="Rename category"
                          disabled={savingCategory === group.category}
                          onClick={() => {
                            setEditingCategory(group.category);
                            setCategoryDrafts((prev) => ({
                              ...prev,
                              [group.category]: group.label,
                            }));
                          }}
                          className="btn-ghost px-2 py-1.5 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {group.hasCustomName && !isEditingGroup && (
                        <button
                          type="button"
                          title="Reset category name"
                          disabled={savingCategory === group.category}
                          onClick={() => updateCategory(group.category, null)}
                          className="btn-ghost px-2 py-1.5 text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-border">
                      <div className="hidden grid-cols-[auto_1fr_100px_120px_100px] gap-3 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted sm:grid">
                        <span>On</span>
                        <span>Service</span>
                        <span>Cost</span>
                        <span>Price / 1k</span>
                        <span />
                      </div>
                      {group.services.map((service, serviceIndex) => {
                        const draft =
                          priceDrafts[service.service] ??
                          service.retailRatePer1000.toFixed(4);
                        const isEditingName = editingService === service.service;
                        const nameDraft =
                          nameDrafts[service.service] ?? service.displayName;

                        return (
                          <div
                            key={service.service}
                            className={`grid gap-3 border-b border-border/60 px-4 py-3 last:border-0 sm:grid-cols-[auto_1fr_100px_120px_100px] sm:items-center ${
                              visibilityTab === "hidden" ? "opacity-60" : ""
                            }`}
                          >
                            <label className="flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={service.enabled}
                                disabled={saving === service.service}
                                onChange={(event) =>
                                  updateService(service.service, {
                                    enabled: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
                              />
                            </label>

                            <div className="min-w-0">
                              {!isSearching && group.services.length > 1 && (
                                <div className="mb-2 flex gap-1 sm:hidden">
                                  <button
                                    type="button"
                                    title="Move service up"
                                    disabled={
                                      serviceIndex === 0 ||
                                      reordering !== null ||
                                      saving === service.service
                                    }
                                    onClick={() =>
                                      reorderItem(
                                        siteList ? "site" : "service",
                                        siteList ? service.category : group.category,
                                        "up",
                                        service.service,
                                      )
                                    }
                                    className="btn-ghost px-1.5 py-1 text-xs"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Move service down"
                                    disabled={
                                      serviceIndex === group.services.length - 1 ||
                                      reordering !== null ||
                                      saving === service.service
                                    }
                                    onClick={() =>
                                      reorderItem(
                                        siteList ? "site" : "service",
                                        siteList ? service.category : group.category,
                                        "down",
                                        service.service,
                                      )
                                    }
                                    className="btn-ghost px-1.5 py-1 text-xs"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                              {isEditingName ? (
                                <input
                                  type="text"
                                  value={nameDraft}
                                  autoFocus
                                  disabled={saving === service.service}
                                  onChange={(event) =>
                                    setNameDrafts((prev) => ({
                                      ...prev,
                                      [service.service]: event.target.value,
                                    }))
                                  }
                                  onBlur={() => saveServiceName(service)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      (event.target as HTMLInputElement).blur();
                                    }
                                    if (event.key === "Escape") {
                                      setEditingService(null);
                                      setNameDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[service.service];
                                        return next;
                                      });
                                    }
                                  }}
                                  className="input w-full py-1.5 text-sm"
                                />
                              ) : (
                                <div className="flex items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-snug">{service.displayName}</p>
                                    {siteList && (
                                      <p className="mt-0.5 text-xs text-muted">{service.categoryLabel}</p>
                                    )}
                                    {service.hasCustomName && (
                                      <p className="mt-0.5 truncate text-xs text-muted">
                                        API: {service.apiName}
                                      </p>
                                    )}
                                    <p className="mt-0.5 text-xs text-muted">
                                      ID {service.service}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    title="Rename service"
                                    disabled={saving === service.service}
                                    onClick={() => {
                                      setEditingService(service.service);
                                      setNameDrafts((prev) => ({
                                        ...prev,
                                        [service.service]: service.displayName,
                                      }));
                                    }}
                                    className="btn-ghost shrink-0 px-1.5 py-1 text-xs"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-muted sm:text-sm">
                              {formatUsdAmount(service.wholesaleRatePer1000)}
                            </p>

                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={draft}
                              disabled={!service.enabled || saving === service.service}
                              onChange={(event) =>
                                setPriceDrafts((prev) => ({
                                  ...prev,
                                  [service.service]: event.target.value,
                                }))
                              }
                              onBlur={() => {
                                const value = Number.parseFloat(draft);
                                if (!Number.isFinite(value) || value < 0) {
                                  setPriceDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[service.service];
                                    return next;
                                  });
                                  return;
                                }
                                if (Math.abs(value - service.retailRatePer1000) < 0.0001) return;
                                updateService(service.service, {
                                  retailRatePer1000: value,
                                });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  (event.target as HTMLInputElement).blur();
                                }
                              }}
                              className="input py-2 text-sm"
                            />

                            <div className="flex justify-end gap-1">
                              {!isSearching && group.services.length > 1 && (
                                <div className="hidden flex-col sm:flex">
                                  <button
                                    type="button"
                                    title="Move service up"
                                    disabled={
                                      serviceIndex === 0 ||
                                      reordering !== null ||
                                      saving === service.service
                                    }
                                    onClick={() =>
                                      reorderItem(
                                        siteList ? "site" : "service",
                                        siteList ? service.category : group.category,
                                        "up",
                                        service.service,
                                      )
                                    }
                                    className="btn-ghost px-1.5 py-0.5 text-xs"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Move service down"
                                    disabled={
                                      serviceIndex === group.services.length - 1 ||
                                      reordering !== null ||
                                      saving === service.service
                                    }
                                    onClick={() =>
                                      reorderItem(
                                        siteList ? "site" : "service",
                                        siteList ? service.category : group.category,
                                        "down",
                                        service.service,
                                      )
                                    }
                                    className="btn-ghost px-1.5 py-0.5 text-xs"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                              {service.hasCustomName && !isEditingName && (
                                <button
                                  type="button"
                                  title="Reset service name"
                                  disabled={saving === service.service}
                                  onClick={() =>
                                    updateService(service.service, { displayName: null })
                                  }
                                  className="btn-ghost px-2 py-1.5 text-xs"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {service.hasCustomPrice && (
                                <button
                                  type="button"
                                  title="Reset to default markup price"
                                  disabled={saving === service.service}
                                  onClick={() =>
                                    updateService(service.service, {
                                      retailRatePer1000: null,
                                    })
                                  }
                                  className="btn-ghost px-2 py-1.5 text-xs"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
