import type { PlatformGroup, ServiceWithPricing } from "@/types/service";
import { getCategoryOverrides } from "./category-overrides";
import { getCategoryDisplayName, getServiceDisplayName } from "./display-names";
import { getServices } from "./gogetviews";
import {
  ALLOWED_PLATFORMS,
  extractPlatform,
  platformIconKey,
} from "./platforms";
import { getRetailRatePer1000 } from "./pricing";
import { getServiceOverrides, isServiceEnabled } from "./service-overrides";

export async function buildCatalog(): Promise<{
  platforms: PlatformGroup[];
  services: ServiceWithPricing[];
}> {
  const [apiServices, overrides, categoryOverrides] = await Promise.all([
    getServices(),
    getServiceOverrides(),
    getCategoryOverrides(),
  ]);

  const enriched: ServiceWithPricing[] = apiServices.flatMap((service) => {
    const platform = extractPlatform(service.category);
    if (!platform || !isServiceEnabled(service.service, overrides)) {
      return [];
    }

    return [
      {
        ...service,
        platform,
        retailRate: getRetailRatePer1000(service, overrides),
        displayName: getServiceDisplayName(service, overrides),
        categoryLabel: getCategoryDisplayName(service.category, categoryOverrides),
        sortOrder: overrides[String(service.service)]?.sortOrder,
        categorySortOrder: categoryOverrides[service.category]?.sortOrder,
      },
    ];
  });

  const platformMap = new Map<string, number>();
  for (const service of enriched) {
    platformMap.set(service.platform, (platformMap.get(service.platform) ?? 0) + 1);
  }

  const platforms: PlatformGroup[] = ALLOWED_PLATFORMS.filter((name) =>
    platformMap.has(name),
  ).map((name) => ({
    id: platformIconKey(name),
    name,
    serviceCount: platformMap.get(name) ?? 0,
  }));

  return { platforms, services: enriched };
}

export async function getCatalogService(serviceId: number) {
  const [apiServices, overrides] = await Promise.all([
    getServices(),
    getServiceOverrides(),
  ]);

  const service = apiServices.find((item) => item.service === serviceId);
  if (!service) return null;

  const platform = extractPlatform(service.category);
  if (!platform || !isServiceEnabled(serviceId, overrides)) return null;

  return {
    service,
    platform,
    overrides,
    retailRate: getRetailRatePer1000(service, overrides),
    displayName: getServiceDisplayName(service, overrides),
  };
}
