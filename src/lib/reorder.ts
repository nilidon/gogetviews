import type { GoGetViewsService } from "@/types/service";
import type { CategoryOverridesMap, ServiceOverridesMap } from "@/types/admin";
import {
  buildCategoryFallbackIndex,
  buildServiceFallbackIndex,
  sortCategoriesForDisplay,
  sortServicesForDisplay,
} from "./display-order";
import { getCategoryOverrides, saveCategoryOverrides } from "./category-overrides";
import { getServices } from "./gogetviews";
import { extractPlatform } from "./platforms";
import { getServiceOverrides, isServiceEnabled, saveServiceOverrides } from "./service-overrides";

function getPlatformCategories(
  apiServices: GoGetViewsService[],
  platform: string,
  serviceOverrides: ServiceOverridesMap,
  enabledOnly: boolean,
): string[] {
  const categories: string[] = [];
  const seen = new Set<string>();

  for (const service of apiServices) {
    if (extractPlatform(service.category) !== platform) continue;
    const enabled = isServiceEnabled(service.service, serviceOverrides);
    if (enabledOnly ? !enabled : enabled) continue;
    if (seen.has(service.category)) continue;
    seen.add(service.category);
    categories.push(service.category);
  }

  return categories;
}

function getCategoryServices(
  apiServices: GoGetViewsService[],
  platform: string,
  category: string,
  serviceOverrides: ServiceOverridesMap,
  enabledOnly: boolean,
): GoGetViewsService[] {
  return apiServices.filter((service) => {
    if (extractPlatform(service.category) !== platform) return false;
    if (service.category !== category) return false;
    const enabled = isServiceEnabled(service.service, serviceOverrides);
    return enabledOnly ? enabled : !enabled;
  });
}

async function orderedCategories(
  platform: string,
  enabledOnly: boolean,
): Promise<{
  categories: string[];
  categoryOverrides: CategoryOverridesMap;
}> {
  const [apiServices, serviceOverrides, categoryOverrides] = await Promise.all([
    getServices(),
    getServiceOverrides(),
    getCategoryOverrides(),
  ]);

  const rawCategories = getPlatformCategories(
    apiServices,
    platform,
    serviceOverrides,
    enabledOnly,
  );
  const fallbackIndex = buildCategoryFallbackIndex(rawCategories);
  const categories = sortCategoriesForDisplay(
    rawCategories,
    (category) => categoryOverrides[category]?.sortOrder,
    (category) => fallbackIndex.get(category) ?? 0,
  );

  return { categories, categoryOverrides };
}

async function orderedServices(
  platform: string,
  category: string,
  enabledOnly: boolean,
) {
  const [apiServices, serviceOverrides] = await Promise.all([
    getServices(),
    getServiceOverrides(),
  ]);

  const rawServices = getCategoryServices(
    apiServices,
    platform,
    category,
    serviceOverrides,
    enabledOnly,
  );
  const fallbackIndex = buildServiceFallbackIndex(rawServices);
  const services = sortServicesForDisplay(
    rawServices,
    (service) => fallbackIndex.get(service.service) ?? 0,
    (service) => serviceOverrides[String(service.service)]?.sortOrder,
  );

  return { services, serviceOverrides };
}

export async function reorderCategory(
  platform: string,
  category: string,
  direction: "up" | "down",
  enabledOnly: boolean,
): Promise<boolean> {
  const { categories, categoryOverrides } = await orderedCategories(
    platform,
    enabledOnly,
  );

  const index = categories.indexOf(category);
  if (index < 0) return false;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= categories.length) return false;

  [categories[index], categories[targetIndex]] = [
    categories[targetIndex],
    categories[index],
  ];

  const now = new Date().toISOString();
  const nextOverrides = { ...categoryOverrides };

  for (let i = 0; i < categories.length; i++) {
    const key = categories[i];
    nextOverrides[key] = {
      ...nextOverrides[key],
      sortOrder: i * 10,
      updatedAt: now,
    };
  }

  await saveCategoryOverrides(nextOverrides);
  return true;
}

export async function reorderService(
  platform: string,
  category: string,
  serviceId: number,
  direction: "up" | "down",
  enabledOnly: boolean,
): Promise<boolean> {
  const { services, serviceOverrides } = await orderedServices(
    platform,
    category,
    enabledOnly,
  );

  const index = services.findIndex((service) => service.service === serviceId);
  if (index < 0) return false;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= services.length) return false;

  [services[index], services[targetIndex]] = [
    services[targetIndex],
    services[index],
  ];

  const now = new Date().toISOString();
  const nextOverrides = { ...serviceOverrides };

  for (let i = 0; i < services.length; i++) {
    const key = String(services[i].service);
    nextOverrides[key] = {
      ...nextOverrides[key],
      enabled: isServiceEnabled(services[i].service, serviceOverrides),
      sortOrder: i * 10,
      updatedAt: now,
    };
  }

  await saveServiceOverrides(nextOverrides);
  return true;
}
