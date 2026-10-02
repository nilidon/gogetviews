import { promises as fs } from "fs";
import path from "path";
import type { ServiceOverride, ServiceOverridesMap } from "@/types/admin";

const DATA_DIR = path.join(process.cwd(), "data");
const OVERRIDES_FILE = path.join(DATA_DIR, "service-overrides.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(OVERRIDES_FILE);
  } catch {
    await fs.writeFile(OVERRIDES_FILE, "{}", "utf-8");
  }
}

export async function getServiceOverrides(): Promise<ServiceOverridesMap> {
  await ensureStore();
  const raw = await fs.readFile(OVERRIDES_FILE, "utf-8");
  return JSON.parse(raw) as ServiceOverridesMap;
}

export async function saveServiceOverrides(
  overrides: ServiceOverridesMap,
): Promise<void> {
  await ensureStore();
  await fs.writeFile(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), "utf-8");
}

export async function getServiceOverride(
  serviceId: number,
): Promise<ServiceOverride | null> {
  const overrides = await getServiceOverrides();
  return overrides[String(serviceId)] ?? null;
}

export async function setServiceOverride(
  serviceId: number,
  patch: {
    enabled?: boolean;
    retailRatePer1000?: number | null;
    displayName?: string | null;
  },
): Promise<ServiceOverride> {
  const overrides = await getServiceOverrides();
  const key = String(serviceId);
  const existing = overrides[key];
  const now = new Date().toISOString();

  let retailRatePer1000 = existing?.retailRatePer1000;
  if (patch.retailRatePer1000 === null) {
    retailRatePer1000 = undefined;
  } else if (patch.retailRatePer1000 !== undefined) {
    retailRatePer1000 = patch.retailRatePer1000;
  }

  let displayName = existing?.displayName;
  if (patch.displayName === null) {
    displayName = undefined;
  } else if (patch.displayName !== undefined) {
    displayName = patch.displayName.trim() || undefined;
  }

  const updated: ServiceOverride = {
    enabled: patch.enabled ?? existing?.enabled ?? false,
    updatedAt: now,
  };

  if (retailRatePer1000 !== undefined) {
    updated.retailRatePer1000 = retailRatePer1000;
  }

  if (displayName !== undefined) {
    updated.displayName = displayName;
  }

  if (existing?.sortOrder !== undefined) {
    updated.sortOrder = existing.sortOrder;
  }

  overrides[key] = updated;
  await saveServiceOverrides(overrides);
  return updated;
}

/** Supplier services stay off until an admin explicitly enables them. */
export function isServiceEnabled(
  serviceId: number,
  overrides: ServiceOverridesMap,
): boolean {
  const override = overrides[String(serviceId)];
  return override?.enabled === true;
}

export async function setBulkServiceEnabled(
  serviceIds: number[],
  enabled: boolean,
): Promise<void> {
  if (serviceIds.length === 0) return;

  const overrides = await getServiceOverrides();
  const now = new Date().toISOString();

  for (const serviceId of serviceIds) {
    const key = String(serviceId);
    const existing = overrides[key];

    const updated: ServiceOverride = {
      enabled,
      updatedAt: now,
    };

    if (existing?.retailRatePer1000 !== undefined) {
      updated.retailRatePer1000 = existing.retailRatePer1000;
    }

    if (existing?.displayName !== undefined) {
      updated.displayName = existing.displayName;
    }

    if (existing?.sortOrder !== undefined) {
      updated.sortOrder = existing.sortOrder;
    }

    overrides[key] = updated;
  }

  await saveServiceOverrides(overrides);
}
