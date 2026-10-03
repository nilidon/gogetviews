"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { PlatformGrid } from "@/components/PlatformGrid";
import { ServiceList } from "@/components/ServiceList";
import { StepProgress } from "@/components/StepProgress";
import { getPlatformBrand } from "@/lib/platform-brands";
import { getLinkFieldHint, getLinkFieldLabel } from "@/lib/service-link-label";
import { formatUsd, retailPriceCentsFromRate } from "@/lib/pricing";
import type { PlatformGroup, ServiceWithPricing } from "@/types/service";

const STEPS = [
  { title: "Platform", hint: "Choose where you want to grow" },
  { title: "Service", hint: "Pick followers, views, likes, and more" },
  { title: "Checkout", hint: "Add your link and complete payment" },
] as const;

interface OrderWizardProps {
  platforms: PlatformGroup[];
  services: ServiceWithPricing[];
  embedded?: boolean;
  onReset?: () => void;
  startRequest?: {
    id: number;
    platform?: string;
    serviceId?: number;
    link?: string;
  } | null;
}

export function OrderWizard({
  platforms,
  services,
  embedded = false,
  onReset,
  startRequest = null,
}: OrderWizardProps) {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceWithPricing | null>(null);
  const [search, setSearch] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformServices = useMemo(() => {
    if (!platform) return [];
    const query = search.trim().toLowerCase();
    return services
      .filter((service) => service.platform === platform)
      .filter((service) => {
        if (!query) return true;
        return (
          service.displayName.toLowerCase().includes(query) ||
          service.categoryLabel.toLowerCase().includes(query) ||
          service.category.toLowerCase().includes(query)
        );
      });
  }, [platform, search, services]);

  const isCommentsService = selectedService?.type
    .toLowerCase()
    .includes("custom comments");

  const resolvedQuantity = useMemo(() => {
    if (!selectedService) return 0;
    if (isCommentsService) {
      return comments.trim().split("\n").filter(Boolean).length;
    }
    return Number.parseInt(quantity, 10) || 0;
  }, [comments, isCommentsService, quantity, selectedService]);

  const priceCents = selectedService
    ? retailPriceCentsFromRate(selectedService.retailRate, resolvedQuantity || 0)
    : 0;

  const canPay = () => {
    if (!selectedService || !link.trim()) return false;
    const min = Number.parseInt(selectedService.min, 10);
    const max = Number.parseInt(selectedService.max, 10);
    if (isCommentsService) {
      const count = comments.trim().split("\n").filter(Boolean).length;
      return count >= min && count <= max;
    }
    const qty = Number.parseInt(quantity, 10);
    return qty >= min && qty <= max;
  };

  const handlePlatformSelect = (value: string) => {
    setPlatform(value);
    setSelectedService(null);
    setSearch("");
    setStep(1);
  };

  const handleServiceSelect = (service: ServiceWithPricing) => {
    setSelectedService(service);
    setStep(2);
  };

  useLayoutEffect(() => {
    if (!startRequest) return;
    if (startRequest.link) {
      setLink(startRequest.link);
    }
    if (startRequest.serviceId) {
      const service = services.find((item) => item.service === startRequest.serviceId);
      if (service) {
        setPlatform(service.platform);
        setSelectedService(service);
        setStep(2);
        return;
      }
    }
    if (embedded || !startRequest.platform) return;
    setPlatform(startRequest.platform);
    setSelectedService(null);
    setSearch("");
    setStep(1);
  }, [embedded, services, startRequest]);

  const handleCheckout = async () => {
    if (!selectedService || !canPay()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.service,
          link: link.trim(),
          quantity: isCommentsService ? undefined : Number.parseInt(quantity, 10),
          comments: isCommentsService ? comments.trim() : undefined,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Checkout failed",
      );
      setLoading(false);
    }
  };

  const brand = platform ? getPlatformBrand(platform) : null;

  if (embedded && !selectedService) {
    return <section id="order" className="scroll-mt-28" />;
  }

  return (
    <section id="order" className={embedded ? "scroll-mt-28 bg-background py-16 md:py-24" : "pb-16 pt-10 sm:pt-14"}>
      <div className={embedded ? "mx-auto max-w-6xl px-5" : "page-shell"}>
        {!embedded && (
          <div className="mb-10 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Get your first{" "}
              <span className="text-primary">10,000</span> views for free.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Select a platform, choose your service, paste your link, and pay securely with Stripe.
            </p>
          </div>
        )}

        {embedded && (
          <div className="mb-10 max-w-xl">
            <p className="text-sm font-semibold text-primary">Order</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Paste a link. We&apos;ll take it from here.
            </h2>
          </div>
        )}

        {!embedded && <StepProgress steps={STEPS} current={step} />}

        <div className="card">
          {(embedded || step > 0) && (
            <button
              type="button"
              onClick={() => {
                if (embedded) {
                  setSelectedService(null);
                  setStep(0);
                  onReset?.();
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                setStep((current) => current - 1);
              }}
              className="btn-ghost -ml-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {!embedded && (
            <div className="mb-7 border-b border-border pb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Step {step + 1}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{STEPS[step].title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{STEPS[step].hint}</p>
            </div>
          )}

          {step === 0 && !embedded && (
            <PlatformGrid
              platforms={platforms}
              selected={platform}
              onSelect={handlePlatformSelect}
            />
          )}

          {step === 1 && platform && !embedded && (
            <div>
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: `${brand?.color}18`,
                  color: brand?.color === "#FFFFFF" ? "#f4f4f5" : brand?.color,
                }}
              >
                {platform}
              </div>
              <ServiceList
                services={platformServices}
                selectedId={selectedService?.service ?? null}
                onSelect={handleServiceSelect}
                search={search}
                onSearchChange={setSearch}
              />
            </div>
          )}

          {step === 2 && selectedService && platform && (
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="space-y-5 lg:col-span-3">
                <label className="block">
                  <span className="label">{getLinkFieldLabel(selectedService)}</span>
                  <input
                    type="url"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder={`https://${platform.toLowerCase()}.com/...`}
                    className="input"
                    autoFocus
                  />
                  <span className="hint">{getLinkFieldHint(selectedService)}</span>
                </label>

                {isCommentsService ? (
                  <label className="block">
                    <span className="label">Comments</span>
                    <textarea
                      value={comments}
                      onChange={(event) => setComments(event.target.value)}
                      rows={5}
                      placeholder={"Love this!\nGreat content\nAmazing post"}
                      className="input resize-none"
                    />
                    <span className="hint">
                      One comment per line · {resolvedQuantity} entered · min{" "}
                      {selectedService.min} · max {selectedService.max}
                    </span>
                  </label>
                ) : (
                  <label className="block">
                    <span className="label">Quantity</span>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      min={selectedService.min}
                      max={selectedService.max}
                      placeholder={selectedService.min}
                      className="input"
                    />
                    <span className="hint">
                      Min {Number(selectedService.min).toLocaleString()} · max{" "}
                      {Number(selectedService.max).toLocaleString()}
                    </span>
                  </label>
                )}

                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                )}
              </div>

              <aside className="rounded-xl border border-border bg-surface-2 p-5 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order summary
                </p>
                <div className="mt-4 space-y-3 border-b border-border pb-4 text-sm">
                  <p className="font-medium leading-snug">{selectedService.displayName}</p>
                  {resolvedQuantity > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Quantity</span>
                      <span className="text-foreground">
                        {resolvedQuantity.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold">
                    {resolvedQuantity > 0 ? formatUsd(priceCents) : "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading || !canPay()}
                  className="btn-primary mt-5 w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      {resolvedQuantity > 0
                        ? `Pay ${formatUsd(priceCents)}`
                        : "Enter details to continue"}
                    </>
                  )}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Secured by Stripe
                </p>
              </aside>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
