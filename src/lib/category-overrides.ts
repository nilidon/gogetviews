import { promises as fs } from "fs";
import path from "path";
import bundledCategories from "@/catalog/category-overrides.json";
import type { CategoryOverride, CategoryOverridesMap } from "@/types/admin";

const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORY_OVERRIDES_FILE = path.join(DATA_DIR, "category-overrides.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CATEGORY_OVERRIDES_FILE);
  } catch {
    await fs.writeFile(CATEGORY_OVERRIDES_FILE, "{}", "utf-8");
  }
}

export async function getCategoryOverrides(): Promise<CategoryOverridesMap> {
  try {
    const raw = await fs.readFile(CATEGORY_OVERRIDES_FILE, "utf-8");
    return JSON.parse(raw) as CategoryOverridesMap;
  } catch {
    return bundledCategories as CategoryOverridesMap;
  }
}

export async function saveCategoryOverrides(
  overrides: CategoryOverridesMap,
): Promise<void> {
  await ensureStore();
  await fs.writeFile(
    CATEGORY_OVERRIDES_FILE,
    JSON.stringify(overrides, null, 2),
    "utf-8",
  );
}

export async function setCategoryOverride(
  category: string,
  displayName: string | null,
): Promise<CategoryOverride | null> {
  const overrides = await getCategoryOverrides();
  const existing = overrides[category];
  const now = new Date().toISOString();

  if (displayName === null || displayName.trim() === "") {
    if (existing?.sortOrder !== undefined) {
      const updated: CategoryOverride = {
        sortOrder: existing.sortOrder,
        updatedAt: now,
      };
      overrides[category] = updated;
      await saveCategoryOverrides(overrides);
      return updated;
    }

    delete overrides[category];
    await saveCategoryOverrides(overrides);
    return null;
  }

  const updated: CategoryOverride = {
    ...existing,
    displayName: displayName.trim(),
    updatedAt: now,
  };

  overrides[category] = updated;
  await saveCategoryOverrides(overrides);
  return updated;
}
