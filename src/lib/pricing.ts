import type { GoGetViewsService } from "@/types/service";
import type { ServiceOverridesMap } from "@/types/admin";
import { config } from "./config";

/** Wholesale rate is quoted per 1,000 units. */
export function wholesalePrice(service: GoGetViewsService, quantity: number): number {
  const rate = Number.parseFloat(service.rate);
  return (rate / 1000) * quantity;
}

export function defaultRetailRatePer1000(service: GoGetViewsService): number {
  return wholesalePrice(service, 1000) * config.markupMultiplier;
}

export function getRetailRatePer1000(
  service: GoGetViewsService,
  overrides?: ServiceOverridesMap,
): number {
  const override = overrides?.[String(service.service)];
  if (override?.retailRatePer1000 !== undefined) {
    return override.retailRatePer1000;
  }
  return defaultRetailRatePer1000(service);
}

export function retailPrice(
  service: GoGetViewsService,
  quantity: number,
  overrides?: ServiceOverridesMap,
): number {
  return retailPriceFromRate(getRetailRatePer1000(service, overrides), quantity);
}

export function retailPriceFromRate(
  retailRatePer1000: number,
  quantity: number,
): number {
  return (retailRatePer1000 / 1000) * quantity;
}

export function retailPriceCents(
  service: GoGetViewsService,
  quantity: number,
  overrides?: ServiceOverridesMap,
): number {
  return retailPriceCentsFromRate(getRetailRatePer1000(service, overrides), quantity);
}

export function retailPriceCentsFromRate(
  retailRatePer1000: number,
  quantity: number,
): number {
  const dollars = retailPriceFromRate(retailRatePer1000, quantity);
  const cents = Math.ceil(dollars * 100);
  return Math.max(cents, config.minimumChargeCents);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatUsdAmount(dollars: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(dollars);
}
