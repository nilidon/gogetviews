import { getServiceDisplayName } from "@/lib/display-names";
import { addOrder, getServices } from "@/lib/gogetviews";
import { extractPlatform } from "@/lib/platforms";
import { getServiceOverrides, isServiceEnabled } from "@/lib/service-overrides";
import type { GoGetViewsService } from "@/types/service";

export const FREE_VIEWS_QUANTITY = 10_000;

export function freeViewsServiceTitle(platform: string): string {
  return `${platform} - Views`;
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ");
}

export async function findFreeViewsService(platform: string): Promise<GoGetViewsService | null> {
  const [services, overrides] = await Promise.all([getServices(), getServiceOverrides()]);
  const title = normalizeTitle(freeViewsServiceTitle(platform));
  const matches = services.filter((service) => {
    if (extractPlatform(service.category) !== platform) return false;
    return normalizeTitle(getServiceDisplayName(service, overrides)) === title;
  });

  return matches.find((service) => isServiceEnabled(service.service, overrides)) ?? matches[0] ?? null;
}

export function freeViewsQuantityFits(service: GoGetViewsService): boolean {
  const min = Number.parseInt(service.min, 10);
  const max = Number.parseInt(service.max, 10);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return FREE_VIEWS_QUANTITY >= min && FREE_VIEWS_QUANTITY <= max;
}

export async function placeFreeViewsOrder(serviceId: number, link: string): Promise<number> {
  const result = await addOrder({
    service: serviceId,
    link,
    quantity: FREE_VIEWS_QUANTITY,
  });
  return result.order;
}
