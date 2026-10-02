import { HomeExperience } from "@/components/home-experience";
import { getCurrentAccount } from "@/lib/account-auth";
import { buildCatalog } from "@/lib/catalog";
import type { PlatformGroup, ServiceWithPricing } from "@/types/service";

export const dynamic = "force-dynamic";

async function loadCatalog() {
  try {
    const catalog = await buildCatalog();
    return { ...catalog, error: null as string | null };
  } catch (error) {
    return {
      platforms: [] as PlatformGroup[],
      services: [] as ServiceWithPricing[],
      error: error instanceof Error ? error.message : "Failed to load services",
    };
  }
}

export default async function HomePage() {
  const [{ platforms, services, error }, account] = await Promise.all([
    loadCatalog(),
    getCurrentAccount(),
  ]);

  return (
    <HomeExperience
      platforms={platforms}
      services={services}
      error={error}
      hasAccount={Boolean(account)}
      freeViewsClaimed={account?.freeViewsClaimed === true}
    />
  );
}
