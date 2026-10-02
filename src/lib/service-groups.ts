import type { ServiceWithPricing } from "@/types/service";
import {
  buildCategoryFallbackIndex,
  buildServiceFallbackIndex,
  effectiveSortOrder,
  sortServicesForDisplay,
} from "./display-order";
import { getCategoryDisplayName } from "./display-names";

export function cleanCategoryLabel(category: string): string {
  return category
    .replace(/^❖\s*/, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export interface ServiceCategoryGroup {
  category: string;
  label: string;
  services: ServiceWithPricing[];
}

export function groupServicesByCategory(
  services: ServiceWithPricing[],
): ServiceCategoryGroup[] {
  const map = new Map<string, ServiceWithPricing[]>();
  const categoryFirstIndex = new Map<string, number>();
  const serviceFirstIndex = buildServiceFallbackIndex(services);

  for (const [index, service] of services.entries()) {
    if (!categoryFirstIndex.has(service.category)) {
      categoryFirstIndex.set(service.category, index);
    }

    const existing = map.get(service.category);
    if (existing) {
      existing.push(service);
    } else {
      map.set(service.category, [service]);
    }
  }

  const groups = Array.from(map.entries()).map(([category, items]) => ({
    category,
    label: items[0]?.categoryLabel ?? getCategoryDisplayName(category),
    services: sortServicesForDisplay(items, (service) =>
      serviceFirstIndex.get(service.service) ?? 0,
    ),
  }));

  return [...groups].sort((a, b) => {
    const aOrder = effectiveSortOrder(
      a.services[0]?.categorySortOrder,
      categoryFirstIndex.get(a.category) ?? 0,
    );
    const bOrder = effectiveSortOrder(
      b.services[0]?.categorySortOrder,
      categoryFirstIndex.get(b.category) ?? 0,
    );
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (categoryFirstIndex.get(a.category) ?? 0) - (categoryFirstIndex.get(b.category) ?? 0);
  });
}

export function sortAdminServiceGroups<
  T extends { category: string; services: Array<{ service: number; sortOrder?: number; categorySortOrder?: number }> },
>(groups: T[], allServices: Array<{ category: string; service: number }>): T[] {
  const categoryFirstIndex = buildCategoryFallbackIndex(
    allServices
      .filter((service, index, list) =>
        list.findIndex((item) => item.category === service.category) === index,
      )
      .map((service) => service.category),
  );
  const serviceFirstIndex = buildServiceFallbackIndex(allServices);

  const sorted = groups.map((group) => ({
    ...group,
    services: sortServicesForDisplay(group.services, (service) =>
      serviceFirstIndex.get(service.service) ?? 0,
    ),
  }));

  return [...sorted].sort((a, b) => {
    const aOrder = effectiveSortOrder(
      a.services[0]?.categorySortOrder,
      categoryFirstIndex.get(a.category) ?? 0,
    );
    const bOrder = effectiveSortOrder(
      b.services[0]?.categorySortOrder,
      categoryFirstIndex.get(b.category) ?? 0,
    );
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (categoryFirstIndex.get(a.category) ?? 0) - (categoryFirstIndex.get(b.category) ?? 0);
  });
}
