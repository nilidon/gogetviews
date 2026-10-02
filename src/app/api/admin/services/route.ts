import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getCategoryOverrides } from "@/lib/category-overrides";
import { getCategoryDisplayName, getServiceDisplayName } from "@/lib/display-names";
import { extractPlatform, ALLOWED_PLATFORMS } from "@/lib/platforms";
import { getServices } from "@/lib/gogetviews";
import { cleanCategoryLabel, sortAdminServiceGroups } from "@/lib/service-groups";
import {
  defaultRetailRatePer1000,
  getRetailRatePer1000,
  wholesalePrice,
} from "@/lib/pricing";
import { getServiceOverrides, isServiceEnabled } from "@/lib/service-overrides";

export const dynamic = "force-dynamic";

export interface AdminServiceRow {
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
  categorySortOrder?: number;
}

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const platformFilter = searchParams.get("platform");

  const [apiServices, overrides, categoryOverrides] = await Promise.all([
    getServices(),
    getServiceOverrides(),
    getCategoryOverrides(),
  ]);

  const services = apiServices.flatMap((service) => {
    const platform = extractPlatform(service.category);
    if (!platform) return [];

    const wholesale = wholesalePrice(service, 1000);
    const defaultRetail = defaultRetailRatePer1000(service);
    const retail = getRetailRatePer1000(service, overrides);
    const override = overrides[String(service.service)];
    const displayName = getServiceDisplayName(service, overrides);

    const row: AdminServiceRow = {
      service: service.service,
      name: displayName,
      displayName,
      apiName: service.name,
      category: service.category,
      categoryLabel: getCategoryDisplayName(service.category, categoryOverrides),
      platform,
      wholesaleRatePer1000: wholesale,
      defaultRetailRatePer1000: defaultRetail,
      retailRatePer1000: retail,
      enabled: isServiceEnabled(service.service, overrides),
      hasCustomPrice: override?.retailRatePer1000 !== undefined,
      hasCustomName: override?.displayName !== undefined,
      sortOrder: override?.sortOrder,
      categorySortOrder: categoryOverrides[service.category]?.sortOrder,
    };

    return [row];
  }).filter((service) =>
    platformFilter ? service.platform === platformFilter : true,
  );

  const categoryMap = new Map<string, AdminServiceRow[]>();
  for (const service of services) {
    const list = categoryMap.get(service.category) ?? [];
    list.push(service);
    categoryMap.set(service.category, list);
  }

  const groups = sortAdminServiceGroups(
    Array.from(categoryMap.entries()).map(([category, items]) => ({
      category,
      label: getCategoryDisplayName(category, categoryOverrides),
      apiLabel: cleanCategoryLabel(category),
      hasCustomName: categoryOverrides[category]?.displayName !== undefined,
      services: items,
    })),
    services.map((service) => ({
      category: service.category,
      service: service.service,
    })),
  );

  const platformCounts = Object.fromEntries(
    ALLOWED_PLATFORMS.map((platform) => [
      platform,
      apiServices.filter((s) => extractPlatform(s.category) === platform).length,
    ]),
  );

  return NextResponse.json({
    platforms: ALLOWED_PLATFORMS.filter((p) => platformCounts[p] > 0),
    platformCounts,
    groups,
    stats: {
      total: services.length,
      enabled: services.filter((s) => s.enabled).length,
      disabled: services.filter((s) => !s.enabled).length,
    },
  });
}
