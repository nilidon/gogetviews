export function effectiveSortOrder(
  sortOrder: number | undefined,
  fallbackIndex: number,
): number {
  return sortOrder ?? fallbackIndex * 10;
}

export function sortServicesForDisplay<T extends { service: number }>(
  services: T[],
  fallbackIndex: (service: T) => number,
  sortOrderFor?: (service: T) => number | undefined,
): T[] {
  return [...services].sort((a, b) => {
    const aOrder = effectiveSortOrder(
      sortOrderFor?.(a) ?? (a as { sortOrder?: number }).sortOrder,
      fallbackIndex(a),
    );
    const bOrder = effectiveSortOrder(
      sortOrderFor?.(b) ?? (b as { sortOrder?: number }).sortOrder,
      fallbackIndex(b),
    );
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.service - b.service;
  });
}

export function sortCategoriesForDisplay(
  categories: string[],
  categorySortOrder: (category: string) => number | undefined,
  fallbackIndex: (category: string) => number,
): string[] {
  return [...categories].sort((a, b) => {
    const orderDiff =
      effectiveSortOrder(categorySortOrder(a), fallbackIndex(a)) -
      effectiveSortOrder(categorySortOrder(b), fallbackIndex(b));
    if (orderDiff !== 0) return orderDiff;
    return fallbackIndex(a) - fallbackIndex(b);
  });
}

export function buildCategoryFallbackIndex(
  categories: string[],
): Map<string, number> {
  return new Map(categories.map((category, index) => [category, index]));
}

export function sortServicesForSite<T extends { service: number; sortOrder?: number }>(
  services: T[],
): T[] {
  const fallback = buildServiceFallbackIndex(services);
  return sortServicesForDisplay(services, (service) => fallback.get(service.service) ?? 0);
}

export function buildServiceFallbackIndex(
  services: Array<{ service: number }>,
): Map<number, number> {
  return new Map(services.map((service, index) => [service.service, index]));
}
