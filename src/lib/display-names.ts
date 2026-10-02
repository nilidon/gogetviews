import type { ServiceOverridesMap } from "@/types/admin";
import type { GoGetViewsService } from "@/types/service";
import { cleanCategoryLabel } from "./service-groups";
import type { CategoryOverridesMap } from "@/types/admin";

export function getServiceDisplayName(
  service: GoGetViewsService,
  overrides?: ServiceOverridesMap,
): string {
  const custom = overrides?.[String(service.service)]?.displayName?.trim();
  return custom || service.name;
}

export function getCategoryDisplayName(
  category: string,
  categoryOverrides?: CategoryOverridesMap,
): string {
  const custom = categoryOverrides?.[category]?.displayName?.trim();
  return custom || cleanCategoryLabel(category);
}
